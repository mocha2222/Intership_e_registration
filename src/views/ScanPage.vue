<template>
  <div class="scan-page">
    <Header />
    
    <div class="scan-container">
      <div class="scan-card">
        
        <div class="dev-badge">v1.2.0 - Phase 1</div>

        <div class="card-header">
          <i class="fas fa-qrcode header-icon"></i>
          <h1>Attendance Scanner</h1>
          <p>Paste or scan the QR token below to check-in</p>
        </div>

        <div class="scan-mode-toggle">
          <button 
            @click="setMode('camera')" 
            :class="{ active: mode === 'camera' }"
            class="toggle-btn"
          >
            <i class="fas fa-camera"></i>
            Camera Scan
          </button>
          <button 
            @click="setMode('manual')" 
            :class="{ active: mode === 'manual' }"
            class="toggle-btn"
          >
            <i class="fas fa-keyboard"></i>
            Manual Input
          </button>
        </div>

        <div class="scanning-area-wrapper mt-4">
          
          <div v-if="errorStatus === 401" class="status-overlay auth-required">
            <i class="fas fa-user-lock status-icon-large"></i>
            <h3>Login Required</h3>
            <p>You must be logged in as the form creator to check-in responses.</p>
            <button @click="goToLogin" class="action-btn primary-btn">
              <i class="fas fa-sign-in-alt me-2"></i> Sign In
            </button>
          </div>

          <div v-else-if="errorStatus === 403" class="status-overlay permission-denied">
            <i class="fas fa-hand-paper status-icon-large"></i>
            <h3>Access Denied</h3>
            <p>Only the creator of this form can scan attendance.</p>
            <button @click="errorStatus = null" class="action-btn secondary-btn">
              <i class="fas fa-arrow-left me-2"></i> Back
            </button>
          </div>

          <div v-else>
            
            <div v-if="mode === 'camera'" class="camera-section">
              <div class="camera-picker mb-3">
                <label class="form-label small fw-bold text-muted">Active Camera:</label>
                <select v-model="selectedCameraId" class="form-select form-select-sm">
                  <option v-if="cameraList.length === 0" value="">Searching for cameras...</option>
                  <option v-for="cam in cameraList" :key="cam.id" :value="cam.id">
                    {{ cam.label || $label('scanner.cameraLabel', { id: cam.id }) }}
                  </option>
                </select>
              </div>

              <div class="qr-reader-wrapper">
                
                <div id="qr-reader" class="qr-view"></div>

                <div v-show="scannerActive" class="scanner-overlay">
                  <div class="scanner-box">
                    <div class="scanner-line"></div>
                    <div class="corner top-left"></div>
                    <div class="corner top-right"></div>
                    <div class="corner bottom-left"></div>
                    <div class="corner bottom-right"></div>
                  </div>
                </div>

                <div v-if="!scannerActive" class="scanner-placeholder">
                  <i class="fas fa-camera-retro mb-3" style="font-size: 2.5rem; opacity: 0.5;"></i>
                  <div v-if="error" class="error-box mb-3 px-3">
                    <p class="error-msg">{{ error }}</p>
                    
                    <div v-if="error.toLowerCase().includes('ended') || error.toLowerCase().includes('invalid')" class="rejection-alert">
                      <i class="fas fa-hand-paper"></i>
                      <span>STOP: Attendance rejected (Past deadline)</span>
                    </div>
                  </div>
                  <button @click="startScanner" class="start-camera-btn">
                    <i class="fas fa-play me-2"></i> Start Camera
                  </button>
                </div>
              </div>
              
              <div class="camera-actions mt-3">
                 <button v-if="scannerActive" @click="stopScanner" class="stop-camera-btn me-2">
                    <i class="fas fa-stop-circle me-1"></i> Stop
                  </button>
                  <button @click="restartScanner" class="reload-btn">
                    <i class="fas fa-sync me-1"></i> Reload Camera
                  </button>
              </div>
            </div>

            <div v-if="mode === 'manual'" class="scan-input-section">
              <div class="input-wrapper">
                <i class="fas fa-keyboard input-icon"></i>
                <input 
                  v-model="qrToken" 
                  type="text" 
                  placeholder="Enter QR Token..." 
                  class="token-input"
                  @keyup.enter="handleScan"
                  autocomplete="off"
                />
              </div>
              
              <div v-if="error && mode === 'manual'" class="error-box mt-3 py-2">
                 <p class="error-msg"><i class="fas fa-exclamation-circle me-1"></i> {{ error }}</p>
              </div>

              <button 
                @click="handleScan" 
                :disabled="loading || !qrToken" 
                class="scan-btn w-100 mt-3"
              >
                <i v-if="loading" class="fas fa-circle-notch fa-spin me-2"></i>
                <i v-else class="fas fa-paper-plane me-2"></i>
                {{ loading ? 'Processing...' : 'Submit Token' }}
              </button>
            </div>
          </div>
        </div>

        <transition name="fade">
          <AttendanceResult v-if="result" :result="result" />
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import AttendanceResult from "@/components/attendance/AttendanceResult.vue";
import Header from '@/components/common/AppHeader.vue';
import { scanAttendance } from '@/api/attendanceApi';
import { Html5Qrcode } from 'html5-qrcode';
export default {
    name: 'ScanPage',
    components: { Header, AttendanceResult },
    data() {
        return {
            mode: 'camera',
            qrToken: '',
            loading: false,
            result: null,
            error: null,
            scannerActive: false,
            cameraList: [],
            selectedCameraId: null,
            camerasLoaded: false,
            errorStatus: null // 401, 403, 400, etc.
        };
    },
    created() {
        this.html5QrCode = null;
    },
    mounted() {
    },
    beforeUnmount() {
        this.stopScanner();
    },
    watch: {
        selectedCameraId(newId, oldId) {
            // Only restart if it's a REAL change, not the initial setup
            if (newId && oldId && this.mode === 'camera' && this.scannerActive) {
                this.restartScanner();
            }
        }
    },
    computed: {},
    methods: {
        // Check if the value is a JSON string representing a file
        // Parse the JSON string to extract the resolved file URL
        // Find and initialize available camera devices
        async initDevices() {
            try {
                const devices = await Html5Qrcode.getCameras();
                this.camerasLoaded = true;
                if (devices && devices.length > 0) {
                    this.cameraList = devices;
                    this.selectedCameraId = devices[0].id;
                }
                else {
                    this.error = 'No camera devices found.';
                }
            }
            catch (err) {
                console.warn('[Scanner] Camera discovery failed:', err);
                this.cameraList = [];
                this.selectedCameraId = null;
                this.camerasLoaded = false;
                this.error = 'Camera access is blocked or unavailable. You can still use Manual Input, or allow camera access and try again.';
            }
        },
        // Switch between Camera and Manual input modes
        async setMode(newMode) {
            if (this.mode === newMode)
                return;
            if (this.mode === 'camera') {
                await this.stopScanner();
            }
            this.mode = newMode;
            this.result = null;
            this.error = null;
            this.errorStatus = null;
        },
        // Stop and restart the scanner with a minor delay
        async restartScanner() {
            await this.stopScanner();
            setTimeout(() => this.startScanner(), 500);
        },
        // Start the QR scanner
        async startScanner() {
            if (this.scannerActive)
                return;
            this.error = null;
            this.loading = true;
            this.$nextTick(async () => {
                try {
                    const container = document.getElementById('qr-reader');
                    if (!container) {
                        console.error('[Scanner] #qr-reader not found');
                        this.error = 'Scanner area not ready. Please try again.';
                        this.loading = false;
                        return;
                    }
                    if (this.html5QrCode && this.scannerActive)
                        return;
                    if (!this.camerasLoaded) {
                        await this.initDevices();
                    }
                    this.html5QrCode = new Html5Qrcode('qr-reader');
                    const cameraConfig = this.selectedCameraId || { facingMode: 'environment' };
                    const config = {
                        fps: 15,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    };
                    await this.html5QrCode.start(cameraConfig, config, (decodedText) => this.handleScanResult(decodedText));
                    this.scannerActive = true;
                }
                catch (err) {
                    console.error('[Scanner] Critical Start Error:', err);
                    this.scannerActive = false;
                    if (err.name === 'NotAllowedError') {
                        this.error = 'Camera permission denied. Please allow camera access in your browser settings, or use Manual Input.';
                    }
                    else if (err.name === 'NotReadableError') {
                        this.error = 'Camera is already in use by another application.';
                    }
                    else {
                        const errorTitle = err.name || 'Error';
                        const errorMsg = err.message || 'Unknown camera error';
                        this.error = `${errorTitle}: ${errorMsg}`;
                    }
                }
                finally {
                    this.loading = false;
                }
            });
        },
        // Stop the QR scanner
        async stopScanner() {
            if (!this.html5QrCode)
                return;
            try {
                if (this.html5QrCode.isScanning) {
                    await this.html5QrCode.stop();
                }
                this.html5QrCode = null;
                this.scannerActive = false;
            }
            catch (err) {
                console.warn('Stop failed:', err);
            }
        },
        // Handle successfully decoded QR code
        async handleScanResult(decodedText) {
            this.playBeep();
            this.qrToken = decodedText;
            try {
                await this.stopScanner();
            }
            catch (e) {
                console.warn('[Scanner] Failed to stop after success:', e);
            }
            await this.handleScan();
        },
        // Play a beep sound on successful scan
        playBeep() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setTargetAtTime(880, ctx.currentTime, 0);
                gain.gain.setTargetAtTime(0.2, ctx.currentTime, 0);
                gain.gain.setTargetAtTime(0, ctx.currentTime + 0.1, 0.01);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
            catch { }
        },
        // Submit the scanned/entered token to the backend
        async handleScan() {
            if (!this.qrToken || this.loading)
                return;
            this.loading = true;
            this.error = null;
            this.errorStatus = null;
            this.result = null;
            try {
                this.result = await scanAttendance(this.qrToken);
                this.qrToken = '';
            }
            catch (err) {
                console.error('Scan API Error:', err);
                this.errorStatus = err.status || 500;
                // Map status codes to localized messages
                if (this.errorStatus === 401) {
                    this.error = 'Login required';
                }
                else if (this.errorStatus === 403) {
                    this.error = 'Permission denied';
                }
                else if (this.errorStatus === 400 || this.errorStatus === 404) {
                    this.error = 'Invalid QR code';
                }
                else {
                    this.error = err.message || 'Check-in failed';
                }
                // Auto-restart scanner after a delay for non-auth errors
                if (this.mode === 'camera' && ![401, 403].includes(this.errorStatus)) {
                    setTimeout(() => this.startScanner(), 4000);
                }
            }
            finally {
                this.loading = false;
            }
        },
        // Redirect to login page
        goToLogin() {
            this.$router.push('/login');
        },
        // Format ISO string/timestamp to local time (HH:MM)
    }
};
</script>

<style scoped src="@/assets/styles/views-ScanPage.css"></style>

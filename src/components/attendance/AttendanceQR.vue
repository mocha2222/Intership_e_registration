<template>
  <div v-if="qrImageUrl && formData?.attendance?.attendanceEnabled" class="qr-code-section">
    <div class="qr-code-label">Your Attendance QR Code</div>
    <div class="qr-code-wrapper">
      <img :src="qrImageUrl" alt="Attendance QR Code" class="qr-code-img" />
    </div>
    <p class="qr-code-hint">Show this QR code to the event organizer to check in.</p>
    <button class="btn-download-qr" @click="downloadLink" :disabled="downloading">
      <template v-if="downloading">
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        Processing...
      </template>
      <template v-else>
        ↓ Download QR Code
      </template>
    </button>

    <div v-if="qrImageUrl && formData" ref="qrDownloadContainer" class="qr-download-capture">
      <div class="qr-capture-content" :style="pageStyle">
        <div class="qr-capture-inner" :style="formStyle">
          <div v-if="logoUrls.length" class="qr-capture-logo">
            <img v-for="(logo, index) in logoUrls" :key="`${index}-${logo}`" :src="$resolveImg(logo)" alt="Logo" crossorigin="anonymous" />
          </div>
          <h2 class="qr-capture-title">{{ formData.title }}</h2>
          <div class="qr-capture-image">
            <img :src="qrImageUrl" alt="QR" />
          </div>
          <p class="qr-capture-hint">Show this QR code to the event organizer to check in.</p>
          <div class="qr-capture-footer">
            DEBC Event Management
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="submitting && formData?.attendance?.attendanceEnabled" class="qr-loading">
    <div class="qr-spinner"></div>
    <p>Generating your QR code...</p>
  </div>
</template>

<script>
import html2canvas from 'html2canvas';
export default {
    name: 'AttendanceQRSection',
    props: {
        qrImageUrl: String,
        formData: Object,
        pageStyle: Object,
        formStyle: Object,
        submitting: Boolean
    },
    data() {
        return {
            downloading: false
        };
    },
    computed: {
        logoUrls() {
            return this.parseLogoUrls(this.formData?.logoUrl);
        }
    },
    methods: {
        parseLogoUrls(value) {
            if (!value || value === 'null')
                return [];
            if (Array.isArray(value))
                return value.filter(Boolean);
            if (typeof value !== 'string')
                return [];
            const trimmed = value.trim();
            if (!trimmed)
                return [];
            if (trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed))
                        return parsed.filter(Boolean);
                }
                catch (e) {
                    // Fall through to legacy single-logo handling.
                }
            }
            return [value];
        },
        async downloadLink() {
            if (!this.qrImageUrl)
                return;
            this.downloading = true;
            try {
                const element = this.$refs.qrDownloadContainer;
                // Force visibility for capture
                element.style.display = 'block';
                element.style.position = 'fixed';
                element.style.top = '0';
                element.style.left = '-9999px';
                const canvas = await html2canvas(element, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: null,
                    logging: false
                });
                element.style.display = 'none';
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `attendance-ticket-${this.formData?.title || 'form'}.png`;
                link.click();
            }
            catch (err) {
                console.error('QR capture failed:', err);
            }
            finally {
                this.downloading = false;
            }
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-attendance-AttendanceQR.css"></style>

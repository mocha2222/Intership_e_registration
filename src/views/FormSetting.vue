<template>
  <div class="settings-page">
    <Header />
    <div class="sub-header-spacer"></div>
    <FormEditorSubheader
      :formTitle="formTitle"
      activeTabProp="SETTINGS"
      @tab-changed="handleTabChange"
    />

    <div class="settings-main">
      <div class="settings-container">
        
        <div class="page-top-header">
          <div class="page-header-icon-wrap">
            <i class="bi bi-gear-fill"></i>
          </div>
          <div class="page-header-text">
            <h1 class="page-header-title">FORM SETTINGS</h1>
            <p class="page-header-sub">Customize form status, timing, and attendance</p>
          </div>
        </div>

        <div class="settings-card">
          
          <div class="settings-section">
            <h2 class="section-label">Title</h2>
            <p class="section-instruction">Enter a name for your form</p>
            <input type="text" class="custom-input" v-model="formTitle" placeholder="Title" @input="saveTitle" />
          </div>

          <div class="settings-section">
            <h2 class="section-label">Form Status</h2>
            <p class="section-instruction">Enable, disable, or conditionally enable your form</p>
            <div class="status-block" @click="openModal">
              <div class="status-block-icon" :class="{ 'bg-success': formStatus === 'enabled', 'bg-secondary': formStatus !== 'enabled' }">
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="28" height="20" rx="10" fill="white" />
                  <circle cx="19" cy="10" r="6" :fill="formStatus === 'enabled' ? '#44A815' : '#94a3b8'" />
                </svg>
              </div>
              <div class="status-block-info">
                <span class="status-block-title">{{ statusLabel.toUpperCase() }}</span>
                <p class="status-block-desc">{{ statusDescription }}</p>
              </div>
              <i class="fas fa-chevron-right status-block-arrow"></i>
            </div>
          </div>

          <div class="settings-section">
            <h2 class="section-label">
              <i class="fas fa-clock section-icon icon-blue"></i>
              Submission Timing
            </h2>
            <p class="section-instruction">Control when users can submit this form</p>
            <div class="input-grid">
              <div class="input-field">
                <label>Opens At</label>
                <div class="datetime-picker-row">
                  <div class="date-input-wrap">
                    <input 
                      type="date" 
                      :value="getDatePart(submissionStartTime)" 
                      @change="updateDatePart('submissionStartTime', $event.target.value)" 
                    />
                  </div>
                  <div class="time-input-wrap">
                    <input 
                      type="time" 
                      :value="getTimePart(submissionStartTime)" 
                      @change="updateTimePart('submissionStartTime', $event.target.value)" 
                    />
                  </div>
                </div>
                <p class="field-hint">Leave empty for no restriction</p>
              </div>
              <div class="input-field">
                <label>Closes At</label>
                <div class="datetime-picker-row">
                  <div class="date-input-wrap">
                    <input 
                      type="date" 
                      :value="getDatePart(submissionEndTime)" 
                      @change="updateDatePart('submissionEndTime', $event.target.value)" 
                    />
                  </div>
                  <div class="time-input-wrap">
                    <input 
                      type="time" 
                      :value="getTimePart(submissionEndTime)" 
                      @change="updateTimePart('submissionEndTime', $event.target.value)" 
                    />
                  </div>
                </div>
                <p class="field-hint">Control when users can submit this form</p>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h2 class="section-label">
              <i class="fas fa-user section-icon icon-green"></i>
              Attendance Tracking
            </h2>
            <p class="section-instruction">Enable QR-based attendance check-in for this form</p>
            <div class="toggle-container">
              <label class="ios-switch">
                <input type="checkbox" v-model="attendanceEnabled" @change="saveTimingFields" />
                <span class="switch-slider"></span>
              </label>
              <span class="toggle-text">{{ attendanceEnabled ? 'ENABLED' : 'DISABLED' }}</span>
            </div>
          </div>

          <template v-if="attendanceEnabled">
            <div class="settings-section attendance-timing-box">
              <h2 class="section-label">
                <i class="fas fa-user-check section-icon icon-purple"></i>
                Attendance Tracking
              </h2>
              <p class="section-instruction">Configure when check-ins are accepted</p>
              <div class="input-grid vertical">
                <div class="input-field">
                  <label>Event Start</label>
                  <div class="datetime-picker-row">
                    <div class="date-input-wrap">
                      <input 
                        type="date" 
                        :value="getDatePart(eventStartTime)" 
                        @change="updateDatePart('eventStartTime', $event.target.value)" 
                      />
                    </div>
                    <div class="time-input-wrap">
                      <input 
                        type="time" 
                        :value="getTimePart(eventStartTime)" 
                        @change="updateTimePart('eventStartTime', $event.target.value)" 
                      />
                    </div>
                  </div>
                  <p class="field-hint">Leave empty for no restriction</p>
                </div>
                <div class="input-field">
                  <label>Late Deadline</label>
                  <div class="datetime-picker-row">
                    <div class="date-input-wrap">
                      <input 
                        type="date" 
                        :value="getDatePart(eventEndTime)" 
                        @change="updateDatePart('eventEndTime', $event.target.value)" 
                      />
                    </div>
                    <div class="time-input-wrap">
                      <input 
                        type="time" 
                        :value="getTimePart(eventEndTime)" 
                        @change="updateTimePart('eventEndTime', $event.target.value)" 
                      />
                    </div>
                  </div>
                  <p class="field-hint">Before Late Deadline → Present</p>
                </div>
                <div class="input-field">
                  <label>Event End</label>
                  <div class="datetime-picker-row">
                    <div class="date-input-wrap">
                      <input 
                        type="date" 
                        :value="getDatePart(attendanceCloseTime)" 
                        @change="updateDatePart('attendanceCloseTime', $event.target.value)" 
                      />
                    </div>
                    <div class="time-input-wrap">
                      <input 
                        type="time" 
                        :value="getTimePart(attendanceCloseTime)" 
                        @change="updateTimePart('attendanceCloseTime', $event.target.value)" 
                      />
                    </div>
                  </div>
                  <p class="field-hint">After Late Deadline, Before Event End → Late</p>
                </div>
              </div>
            </div>
          </template>

          <div class="settings-section">
            <h2 class="section-label">
              <i class="bi bi-archive-fill section-icon icon-orange"></i>
              Workshop Materials
            </h2>
            <p class="section-instruction">Upload files that responders can access before filling the form</p>
            <div class="toggle-container mb-4">
              <label class="ios-switch">
                <input type="checkbox" v-model="materialUploadEnabled" @change="saveMaterialToggle" />
                <span class="switch-slider"></span>
              </label>
              <span class="toggle-text">{{ materialUploadEnabled ? 'ENABLED' : 'DISABLED' }}</span>
            </div>

            <template v-if="materialUploadEnabled">
              <div 
                class="drag-drop-zone"
                @dragover.prevent="matDragOver = true" 
                @dragleave.prevent="matDragOver = false" 
                @drop.prevent="handleMatDrop"
                :class="{ 'is-dragging': matDragOver }"
              >
                <div class="drag-icon" style="margin-bottom: 8px;">
                  <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 25 C10 22 13 20 16 20 L20 20 C21 24 29 24 30 20 L34 20 C37 20 40 22 40 25 L40 35 C40 38 37 40 34 40 L16 40 C13 40 10 38 10 35 Z" fill="#737373" />
                    <rect x="22" y="32" width="6" height="2" rx="1" fill="white" />
                    <path d="M25 5 L25 22 M18 15 L25 24 L32 15" stroke="#737373" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <p class="drag-text">Drag &amp; drop files here</p>
                <button class="browse-btn" @click="$refs.matFileInput.click()">Browse Files</button>
                <input ref="matFileInput" type="file" multiple style="display:none" @change="handleMatFileSelect" />
                <p class="drag-hint">Max 10MB per file · PDF, Images, Office docs</p>
              </div>

              <div v-if="uploadedMaterials.length > 0" class="file-list-compact">
                <div v-for="mat in uploadedMaterials" :key="mat.id" class="file-row">
                  <i :class="getMatIcon(mat.mimeType)" class="file-icon"></i>
                  <div class="file-info">
                    <span class="file-name">{{ mat.originalName }}</span>
                    <span class="file-size">{{ formatFileSize(mat.size) }}</span>
                  </div>
                  <button class="file-delete" @click="deleteMatFile(mat.id)"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div> 

      <div v-if="saveStatus" class="save-indicator" :class="saveStatus">
        <template v-if="saveStatus === 'saving'">Saving...</template>
        <template v-else-if="saveStatus === 'saved'">✓ Saved</template>
        <template v-else-if="saveStatus === 'error'">
          {{ saveErrorMessage || 'Error' }}
        </template>
      </div>
    </div>

    <FormStatusModal
      :visible="modalVisible"
      :initial-status="formStatus"
      :initial-expiration-date="expirationDate"
      :initial-expiration-time="expirationTime"
      :initial-submission-limit="submissionLimit"
      @close="modalVisible = false"
      @save="onStatusSave"
    />

  </div>
</template>

<script>
import Header from '@/components/common/AppHeader.vue';
import FormEditorSubheader from '@/components/builder/BuilderToolbar.vue';
import FormStatusModal from '@/components/builder/SettingsMenu.vue';
import { getForm, saveForm } from '@/store/formStore';
import { getMyForm } from '@/api/formsApi';
import { getMaterials, fetchMaterials, uploadMaterials, deleteMaterial } from '@/store/materialStore';
import { apiFormToStore } from '@/utils/mapper';
import { toLocalDatetime } from '@/utils/dates';
export default {
    name: 'FormSettings',
    components: { Header, FormEditorSubheader, FormStatusModal },
    data() {
        return {
            formId: this.$route.params.id || 'default',
            storeForm: null,
            formTitle: 'Loading...',
            formStatus: 'enabled',
            modalVisible: false,
            saveStatus: '',
            // Submission timing
            submissionStartTime: '',
            submissionEndTime: '',
            // Attendance
            attendanceEnabled: false,
            eventStartTime: '',
            eventEndTime: '',
            attendanceCloseTime: '',
            saveErrorMessage: '',
            submissionTimeError: '',
            eventStartTimeError: '',
            lateDeadlineError: '',
            eventEndTimeError: '',
            // Status details
            expirationDate: '',
            expirationTime: '12:15 PM',
            submissionLimit: '1,000',
            // Materials
            materialUploadEnabled: false,
            uploadedMaterials: [],
            matUploading: false,
            matUploadError: '',
            matDragOver: false,
        };
    },
    computed: {
        statusLabel() {
            return this.$label(`settings.statusLabels.${this.formStatus}`) || 'ENABLED';
        },
        statusDescription() {
            return this.$label(`settings.statusDescriptions.${this.formStatus}`) || '';
        },
        statusIconClass() { return this.formStatus === 'enabled' ? 'icon-green' : 'icon-gray'; },
        statusBadgeClass() { return this.formStatus === 'enabled' ? 'badge-green' : 'badge-gray'; },
    },
    async mounted() {
        if (this.formId === 'default')
            return;
        try {
            let sf = getForm(String(this.formId));
            if (!sf)
                sf = apiFormToStore(await getMyForm(this.formId));
            this.storeForm = sf;
            this.formTitle = sf.title;
            this.formStatus = sf.status || 'enabled';
            this.expirationDate = sf.expirationDate || '';
            this.expirationTime = sf.expirationTime || '12:15 PM';
            this.submissionLimit = sf.settings?.submissionLimit?.toLocaleString() || '1,000';
            // Load timing fields
            this.submissionStartTime = toLocalDatetime(sf.settings?.submissionStartTime);
            this.submissionEndTime = toLocalDatetime(sf.settings?.submissionEndTime);
            this.attendanceEnabled = sf.attendance?.attendanceEnabled || false;
            this.eventStartTime = toLocalDatetime(sf.attendance?.eventStartTime);
            this.eventEndTime = toLocalDatetime(sf.attendance?.eventEndTime);
            this.attendanceCloseTime = toLocalDatetime(sf.attendance?.attendanceCloseTime);
            // Materials
            this.materialUploadEnabled = sf.settings?.materialUploadEnabled || false;
            if (this.materialUploadEnabled) {
                try {
                    this.uploadedMaterials = await fetchMaterials(this.storeForm.shareToken, this.formId);
                }
                catch (e) {
                    this.uploadedMaterials = [];
                }
            }
        }
        catch (err) {
            if (err.status === 403 || err.status === 404) {
                alert("You do not have permission to open this form.");
                this.$router.push('/home');
            }
            else {
                alert("Could not load form settings.");
                this.$router.push('/home');
            }
        }
    },
    methods: {
        openModal() { this.modalVisible = true; },
        syncFormSettings() {
            if (!this.storeForm)
                return false;
            this.storeForm.title = this.formTitle;
            this.storeForm.status = this.formStatus;
            this.storeForm.expirationDate = this.expirationDate || null;
            this.storeForm.expirationTime = this.expirationTime || null;
            this.storeForm.settings = {
                ...this.storeForm.settings,
                materialUploadEnabled: this.materialUploadEnabled,
                submissionLimit: this.submissionLimit
                    ? parseInt(String(this.submissionLimit).replace(/,/g, ''), 10) || null
                    : null,
                submissionStartTime: this.submissionStartTime || null,
                submissionEndTime: this.submissionEndTime || null,
            };
            this.storeForm.attendance = {
                attendanceEnabled: this.attendanceEnabled,
                eventStartTime: this.eventStartTime || null,
                eventEndTime: this.eventEndTime || null,
                attendanceCloseTime: this.attendanceCloseTime || null,
            };
            return true;
        },
        async saveSettings() {
            if (!this.syncFormSettings())
                return;
            this.saveStatus = 'saving';
            try {
                await saveForm(this.storeForm);
                this.saveStatus = 'saved';
                setTimeout(() => { this.saveStatus = ''; }, 2000);
            }
            catch (error) {
                this.saveStatus = 'error';
                this.saveErrorMessage = error.message || 'Could not save form settings.';
                setTimeout(() => { this.saveStatus = ''; }, 4000);
            }
        },
        saveTitle() {
            this.saveSettings();
        },
        todayString() {
            const d = new Date();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${d.getFullYear()}-${mm}-${dd}`;
        },
        getDatePart(dateTimeStr) {
            if (!dateTimeStr)
                return '';
            return dateTimeStr.split('T')[0] || '';
        },
        getTimePart(dateTimeStr) {
            if (!dateTimeStr)
                return '';
            return dateTimeStr.split('T')[1] || '';
        },
        updateDatePart(field, dateVal) {
            const currentVal = this[field] || '';
            const timePart = currentVal.split('T')[1] || '00:00';
            this[field] = dateVal ? `${dateVal}T${timePart}` : '';
            this.saveTimingFields();
        },
        updateTimePart(field, timeVal) {
            const currentVal = this[field] || '';
            const datePart = currentVal.split('T')[0] || this.todayString();
            this[field] = timeVal ? `${datePart}T${timeVal}` : `${datePart}T00:00`;
            this.saveTimingFields();
        },
        async onStatusSave(payload) {
            if (payload && payload.status) {
                this.formStatus = payload.status;
                this.expirationDate = payload.expirationDate;
                this.expirationTime = payload.expirationTime;
                this.submissionLimit = payload.submissionLimit;
                this.saveStatus = 'saving';
                try {
                    await this.saveSettings();
                    this.saveStatus = 'saved';
                    setTimeout(() => { this.saveStatus = ''; }, 2000);
                }
                catch (e) {
                    console.error('Status save failed:', e);
                    this.saveStatus = 'error';
                    this.saveErrorMessage = e.message || '';
                    setTimeout(() => { this.saveStatus = ''; }, 4000);
                }
            }
            this.modalVisible = false;
        },
        async saveTimingFields() {
            // ── Client-side Validation ──
            this.saveErrorMessage = '';
            this.submissionTimeError = '';
            this.eventStartTimeError = '';
            this.lateDeadlineError = '';
            this.eventEndTimeError = '';
            let hasError = false;
            // 1. Submission Interval
            if (this.submissionStartTime && this.submissionEndTime) {
                if (new Date(this.submissionEndTime) < new Date(this.submissionStartTime)) {
                    this.submissionTimeError = 'End time must be after start time';
                    hasError = true;
                }
            }
            // 2. Attendance Timing
            if (this.attendanceEnabled) {
                const subStart = this.submissionStartTime ? new Date(this.submissionStartTime) : null;
                const subEnd = this.submissionEndTime ? new Date(this.submissionEndTime) : null;
                const evStart = this.eventStartTime ? new Date(this.eventStartTime) : null;
                const evLate = this.eventEndTime ? new Date(this.eventEndTime) : null;
                const evEnd = this.attendanceCloseTime ? new Date(this.attendanceCloseTime) : null;
                // Rule: Event Start must be within Submission Interval
                if (evStart) {
                    if ((subStart && evStart < subStart) || (subEnd && evStart > subEnd)) {
                        this.eventStartTimeError = 'Event Start must be between Submission Start and End';
                        hasError = true;
                    }
                }
                // Rule: Late Deadline must be after Event Start
                if (evStart && evLate) {
                    if (evLate < evStart) {
                        this.lateDeadlineError = 'Late Deadline must be after Event Start';
                        hasError = true;
                    }
                }
                // Rule: Event End must be after Late Deadline
                if (evLate && evEnd) {
                    if (evEnd < evLate) {
                        this.eventEndTimeError = 'Event End must be at or after Late Deadline';
                        hasError = true;
                    }
                }
            }
            if (hasError) {
                this.saveStatus = 'error';
                this.saveErrorMessage = 'settings.errorFixBelow';
                setTimeout(() => { this.saveStatus = ''; }, 4000);
                return;
            }
            await this.saveSettings();
        },
        handleTabChange(tab) {
            const id = this.$route.params.id;
            if (!id)
                return;
            if (tab === 'BUILD')
                this.$router.push({ name: 'formEditor', params: { id } });
            else if (tab === 'PUBLISH')
                this.$router.push({ name: 'FormShare', params: { id } });
        },
        // ── Materials ──
        async saveMaterialToggle() {
            this.saveStatus = 'saving';
            try {
                await this.saveSettings();
                if (this.materialUploadEnabled && this.uploadedMaterials.length === 0) {
                    try {
                        this.uploadedMaterials = getMaterials(this.formId);
                    }
                    catch (e) { }
                }
                this.saveStatus = 'saved';
                setTimeout(() => { this.saveStatus = ''; }, 2000);
            }
            catch (e) {
                this.saveStatus = 'error';
                this.saveErrorMessage = e.message || '';
                setTimeout(() => { this.saveStatus = ''; }, 4000);
            }
        },
        async handleMatFileSelect(event) {
            const files = Array.from(event.target.files || []);
            if (files.length > 0)
                await this.doUploadMaterials(files);
            event.target.value = '';
        },
        async handleMatDrop(event) {
            this.matDragOver = false;
            const files = Array.from(event.dataTransfer?.files || []);
            if (files.length > 0)
                await this.doUploadMaterials(files);
        },
        async doUploadMaterials(files) {
            this.matUploading = true;
            this.matUploadError = '';
            try {
                await uploadMaterials(this.formId, files);
                this.uploadedMaterials = getMaterials(this.formId);
            }
            catch (e) {
                this.matUploadError = e.message || "Could not upload these files.";
            }
            finally {
                this.matUploading = false;
            }
        },
        async deleteMatFile(materialId) {
            try {
                await deleteMaterial(this.formId, materialId);
                this.uploadedMaterials = getMaterials(this.formId);
            }
            catch (e) {
                this.matUploadError = e.message || 'settings.errorDeleteFailed';
            }
        },
        formatFileSize(bytes) {
            if (!bytes)
                return '0 B';
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            let size = bytes;
            while (size >= 1024 && i < units.length - 1) {
                size /= 1024;
                i++;
            }
            return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
        },
        getMatIcon(mimeType) {
            if (!mimeType)
                return 'fas fa-file';
            if (mimeType === 'application/pdf')
                return 'fas fa-file-pdf';
            if (mimeType.startsWith('image/'))
                return 'fas fa-file-image';
            if (mimeType.includes('word') || mimeType.includes('document'))
                return 'fas fa-file-word';
            if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
                return 'fas fa-file-excel';
            if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
                return 'fas fa-file-powerpoint';
            return 'fas fa-file';
        },
    },
};
</script>

<style scoped src="@/assets/styles/views-FormSetting.css"></style>

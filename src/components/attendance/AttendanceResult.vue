<template>
<div  class="result-section" :class="result.status">
            <div class="result-header">
              <div class="status-badge" v-if="result.status">
                <i :class="statusIcon"></i>
                {{ $label('status.' + result.status) }}
              </div>
              <span class="checkin-time" v-if="result.checkInTime">
                {{ formatTime(result.checkInTime) }}
              </span>
            </div>
            
            <p class="result-message">{{ result.message }}</p>

            <div v-if="result.status === 'rejected'" class="rejection-alert">
              <i class="fas fa-hand-paper"></i>
              <span>STOP: Attendance rejected (Past deadline)</span>
            </div>

            <div v-if="result.formData" class="respondent-data">
              <h3>Respondent Info</h3>
              <div class="data-grid">
                <div v-for="(value, label) in result.formData" :key="label" class="data-item">
                  <span class="data-label">{{ label }}:</span>
                  <span class="data-value">
                    <template v-if="isFileJson(value)">
                      <a :href="getParsedUrl(value)" target="_blank" class="file-view-link">
                        <i class="fas fa-external-link-alt"></i> View File
                      </a>
                    </template>
                    <template v-else>
                      {{ value }}
                    </template>
                  </span>
                </div>
              </div>
            </div>
          </div>
</template>
<script>
export default {
    props: { result: { type: Object, required: true } },
    computed: { statusIcon() {
            if (!this.result || !this.result.status)
                return '';
            const icons = {
                present: 'fas fa-check-circle',
                late: 'fas fa-clock',
                rejected: 'fas fa-times-circle',
                duplicate: 'fas fa-copy',
                absent: 'fas fa-user-clock'
            };
            return icons[this.result.status] || 'fas fa-info-circle';
        } },
    methods: { isFileJson(val) {
            if (typeof val !== 'string' || !val.startsWith('{') || !val.includes('fileUrl')) {
                return false;
            }
            try {
                return !!JSON.parse(val).fileUrl;
            }
            catch {
                return false;
            }
        },
        getParsedUrl(val) {
            try {
                const parsed = JSON.parse(val);
                return this.$resolveImg ? this.$resolveImg(parsed.fileUrl) : parsed.fileUrl;
            }
            catch {
                return '#';
            }
        },
        formatTime(time) {
            if (!time)
                return '';
            return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } },
};
</script>
<style scoped src="@/assets/styles/views-ScanPage.css"></style>

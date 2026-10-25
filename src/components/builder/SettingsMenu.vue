<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box">

        <div class="modal-header">
          <div class="header-left">
            <div class="header-icon bg-success-header">
              <svg width="24" height="16" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="28" height="20" rx="10" fill="white" />
                <circle cx="19" cy="10" r="6" fill="#189f59" />
              </svg>
            </div>
            <div>
              <h2 class="modal-title">Form Status</h2>
              <p class="modal-subtitle">Select the status of your form</p>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="modal-divider"></div>

        <div class="status-section">
          <h3 class="body-title">Form Status</h3>
          <p class="body-desc">Enable, disable, or conditionally enable your form</p>

          <div class="custom-select" :class="{ open: dropdownOpen }" ref="selectRef">
            <div class="select-trigger" @click.stop="toggleDropdown">
              <span>{{ selectedLabel }}</span>
              <i class="fas fa-chevron-down chevron" :class="{ rotated: dropdownOpen }"></i>
            </div>
            <transition name="dropdown-fade">
              <ul v-if="dropdownOpen" class="select-options">
                <li
                  v-for="opt in options"
                  :key="opt.value"
                  class="select-option"
                  :class="{ selected: selected === opt.value }"
                  @click.stop="selectOption(opt)"
                >
                  {{ $label('settings.statusModal.options.' + opt.value) }}
                </li>
              </ul>
            </transition>
          </div>
        </div>

        <div v-if="showDate || showLimit" class="extra-scroll">

          <template v-if="showDate">
            <div class="modal-divider"></div>
            <div class="field-block">
              <h3 class="body-title">Expiration Date</h3>
              <p class="body-desc">Disable form on a date</p>
              <div class="date-time-row">
                <div class="date-select-wrap">
                  <span class="dt-icon"><i class="fas fa-calendar-alt"></i></span>
                  <input type="date" class="dt-input" v-model="expirationDate" @click.stop />
                  <i class="fas fa-chevron-down dt-chevron"></i>
                </div>
                <span class="at-label">at</span>
                <div class="date-select-wrap">
                  <span class="dt-icon"><i class="fas fa-clock"></i></span>
                  <select class="dt-select" v-model="expirationTime" @click.stop>
                    <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <i class="fas fa-chevron-down dt-chevron"></i>
                </div>
              </div>
              <p class="timezone-note">
                <i class="fas fa-info-circle"></i>
                Based on your local timezone
              </p>
            </div>
          </template>

          <template v-if="showLimit">
            <div class="modal-divider"></div>
            <div class="field-block">
              <h3 class="body-title">Submission Limit</h3>
              <p class="body-desc">Limit the total number of submissions (e.g., 1,000)</p>
              <input type="text" class="limit-input" v-model="submissionLimit" placeholder="1,000" @click.stop />
            </div>
          </template>

        </div>

        <div class="modal-divider"></div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close')">CANCEL</button>
          <button class="btn-save" @click="save">SAVE</button>
        </div>

      </div>
    </div>
  </transition>
</template>

<script>
export default {
    name: 'FormStatusModal',
    props: {
        visible: { type: Boolean, default: false },
        initialStatus: { type: String, default: 'enabled' },
        initialExpirationDate: { type: String, default: '' },
        initialExpirationTime: { type: String, default: '12:15 PM' },
        initialSubmissionLimit: { type: [String, Number], default: '' },
    },
    data() {
        return {
            selected: this.initialStatus,
            dropdownOpen: false,
            expirationDate: this.todayString(),
            expirationTime: '12:15 PM',
            submissionLimit: '1,000',
            warningMessage: '',
            options: [
                { value: 'enabled', label: 'Enabled' },
                { value: 'disabled', label: 'Disabled' },
                { value: 'disable_date', label: 'Disable on specific date' },
                { value: 'disable_limit', label: 'Disable at submission limit' },
                { value: 'disable_both', label: 'Disable on specific date or at submission limit' },
            ],
        };
    },
    computed: {
        selectedLabel() {
            return this.$label('settings.statusModal.options.' + this.selected);
        },
        showDate() { return ['disable_date', 'disable_both'].includes(this.selected); },
        showLimit() { return ['disable_limit', 'disable_both'].includes(this.selected); },
        timeOptions() {
            const times = [];
            for (let h = 0; h < 24; h++) {
                for (let m = 0; m < 60; m += 15) {
                    const hour = h % 12 === 0 ? 12 : h % 12;
                    const minute = String(m).padStart(2, '0');
                    const ampm = h < 12 ? 'AM' : 'PM';
                    times.push(`${hour}:${minute} ${ampm}`);
                }
            }
            return times;
        },
    },
    methods: {
        todayString() {
            const d = new Date();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${d.getFullYear()}-${mm}-${dd}`;
        },
        toggleDropdown() {
            this.dropdownOpen = !this.dropdownOpen;
        },
        selectOption(opt) {
            this.selected = opt.value;
            this.dropdownOpen = false;
        },
        save() {
            this.$emit('save', {
                status: this.selected,
                expirationDate: this.showDate ? this.expirationDate : null,
                expirationTime: this.showDate ? this.expirationTime : null,
                submissionLimit: this.showLimit ? this.submissionLimit : null,
                warningMessage: (this.showDate || this.showLimit) ? this.warningMessage : null,
            });
            this.$emit('close');
        },
        handleOutside(e) {
            // Only act if dropdown is open and selectRef exists.
            if (!this.dropdownOpen)
                return;
            const ref = this.$refs.selectRef;
            if (!ref)
                return;
            if (!ref.contains(e.target)) {
                this.dropdownOpen = false;
            }
        },
    },
    mounted() { document.addEventListener('mousedown', this.handleOutside); },
    beforeUnmount() { document.removeEventListener('mousedown', this.handleOutside); },
    watch: {
        visible(val) {
            if (val) {
                // Restore all saved values when the modal opens
                this.selected = this.initialStatus;
                this.expirationDate = this.initialExpirationDate || this.todayString();
                this.expirationTime = this.initialExpirationTime || '12:15 PM';
                const limit = this.initialSubmissionLimit;
                this.submissionLimit = limit ? String(limit).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '1,000';
                this.dropdownOpen = false;
            }
            else {
                this.dropdownOpen = false;
            }
        },
        initialStatus(newVal) {
            if (this.visible) {
                this.selected = newVal;
            }
        }
    },
};
</script>

<style scoped src="@/assets/styles/components-builder-SettingsMenu.css"></style>
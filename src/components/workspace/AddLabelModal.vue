<template>
  <div v-if="open" class="jf-modal-wrap" @click.self="$emit('close')">
    <div class="jf-modal-card">
      <div class="jf-modal-head d-flex align-items-center justify-content-between">
        <h5 class="jf-modal-title mb-0">Add Label</h5>
        <button class="btn jf-close-btn" type="button" @click="$emit('close')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="jf-modal-body">
        <label class="form-label jf-body-label mb-2">Access Settings</label>
        <input
          v-model.trim="labelName"
          type="text"
          class="form-control jf-input"
          :class="{ 'is-invalid': labelNameError }"
          placeholder="Add label name here"
          maxlength="40"
          @blur="validateLabelName"
          @keyup.enter="submit"
        />
        <div v-if="labelNameError" class="invalid-feedback d-block mt-2">
          {{ $label(labelNameError.key, labelNameError.params) }}
        </div>
      </div>

      <div class="jf-modal-foot d-flex align-items-center justify-content-between">
        <button class="btn jf-cancel-btn" type="button" @click="$emit('close')">Cancel</button>
        <button class="btn jf-save-btn" type="button" :disabled="!labelName" @click="submit">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
import { sanitizeText, validateSafeName } from '@/utils/validators';
export default {
    name: 'AddLabelModal',
    props: {
        open: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            labelName: '',
            labelNameError: null,
        };
    },
    watch: {
        open(value) {
            if (value) {
                this.labelName = '';
                this.labelNameError = null;
            }
        },
    },
    methods: {
        validateLabelName() {
            this.labelName = sanitizeText(this.labelName, 40).trim();
            this.labelNameError = validateSafeName(this.labelName, 'Access Settings', 2, 40);
            return !this.labelNameError;
        },
        submit() {
            if (!this.validateLabelName())
                return;
            this.$emit('save', this.labelName.trim());
            this.labelName = '';
            this.labelNameError = null;
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-workspace-AddLabelModal.css"></style>

<template>
  <div class="block-wrapper" :class="{ 'edit-mode': isEditing }" @click="enterEdit">
    <p class="field-label">{{ label }}</p>

    <div class="input-row position-relative">
      <input
        v-model="localValue"
        class="field-input"
        type="tel"
        :placeholder="placeholder"
        @input="onInput"
      />
    </div>
    <span class="sub-label">{{ hint }}</span>

    <div v-if="isEditing" class="block-actions">
      <button class="action-btn settings-btn" title="Settings" @click.stop="$emit('settings')">
        <i class="fas fa-cog"></i>
      </button>
      <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
    name: 'PhoneBlock',
    props: {
        label: { type: String, default: 'Phone Number' },
        placeholder: { type: String, default: '(000) 000-0000' },
        hint: { type: String, default: 'Please enter a valid phone number.' },
        value: { type: String, default: '' },
    },
    data() {
        return {
            isEditing: false,
            localValue: this.value,
        };
    },
    methods: {
        enterEdit() {
            if (!this.isEditing) {
                this.isEditing = true;
                document.addEventListener('click', this.exitEdit);
            }
        },
        exitEdit(e) {
            // Only exit if click is outside this block
            if (!this.$el.contains(e.target)) {
                this.isEditing = false;
                document.removeEventListener('click', this.exitEdit);
            }
        },
        onInput(e) {
            // Remove all non-digit characters
            const digits = e.target.value.replace(/\D+/g, '');
            this.localValue = digits;
            this.$emit('update:value', digits);
        }
    },
    watch: {
        value(newVal) {
            this.localValue = newVal;
        }
    },
};
</script>

<style scoped src="@/assets/styles/components-attendance-PhoneEntry.css"></style>
<template>
  <div class="element-label-container">
    <template v-if="mode === 'builder'">
      <input
        v-if="isActive"
        :value="modelValue"
        class="label-edit-input"
        :placeholder="placeholder || 'Type a question'"
        @input="onInput"
      />
      <p v-else class="field-label">{{ displayLabel }}</p>
    </template>
    <template v-else>
      <label class="fill-label">
        {{ displayLabel }}
        <span v-if="required" class="required-asterisk">*</span>
      </label>
    </template>
  </div>
</template>

<script>
export default {
    name: 'FormElementLabel',
    props: {
        modelValue: { type: String, default: '' },
        labelKey: { type: String, default: '' },
        isActive: { type: Boolean, default: false },
        mode: { type: String, default: 'builder' },
        placeholder: { type: String, default: '' },
        defaultLabel: { type: String, default: '' },
        required: { type: Boolean, default: false }
    },
    emits: ['update:modelValue', 'edit'],
    computed: {
        displayLabel() {
            if (this.labelKey && !this.modelValue) {
                return this.$label(this.labelKey);
            }
            return this.modelValue || this.defaultLabel || '';
        }
    },
    methods: {
        onInput(e) {
            this.$emit('update:modelValue', e.target.value);
            this.$emit('edit', e.target.value);
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-fields-FieldLabel.css"></style>

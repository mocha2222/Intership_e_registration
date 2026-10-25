<template>
  <div class="element-sublabel-container">
    <template v-if="mode === 'builder'">
      <input
        v-if="isActive"
        :value="modelValue"
        class="sublabel-edit-input"
        :placeholder="placeholder || 'Type a sublabel'"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <p v-else class="sublabel-view">{{ modelValue || defaultSublabel || '' }}</p>
    </template>
    <template v-else>
      <p v-if="modelValue || defaultSublabel" class="fill-help-text">
        {{ modelValue || defaultSublabel }}
      </p>
    </template>
  </div>
</template>

<script>
export default {
    name: 'FormElementSublabel',
    props: {
        modelValue: { type: String, default: '' },
        isActive: { type: Boolean, default: false },
        mode: { type: String, default: 'builder' },
        placeholder: { type: String, default: '' },
        defaultSublabel: { type: String, default: '' }
    },
    emits: ['update:modelValue']
};
</script>

<style scoped src="@/assets/styles/components-fields-FieldSublabel.css"></style>

<template>
  <div
    class="block-wrapper"
    :class="{ 'edit-mode': isActive && mode === 'builder', 'public-mode': mode === 'public' }"
  >
    
    <FormElementLabel
      v-model="localLabel"
      :label-key="elSettings?.labelKey"
      :is-active="isActive"
      :mode="mode"
      placeholder="Email"
      default-label="Email"
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      <input
        v-model="localValue"
        class="email-input"
        type="email"
        :readonly="!isActive"
      />
    </template>

    <template v-else>
      <input
        type="email"
        class="fill-input"
        :class="{ 'input-error': hasError }"
        :value="answer"
        :readonly="readonly"
        @input="$emit('update:answer', $event.target.value)"
      />
    </template>

    <FormElementSublabel
      v-model="localSubLabel"
      :is-active="isActive"
      :mode="mode"
      placeholder="Email"
      @update:modelValue="syncBuilderState"
    />

    <div v-if="isActive && mode === 'builder'" class="block-actions">
      <button class="action-btn delete-btn" title="Delete" @click="$emit('delete')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
import FormElementSublabel from '@/components/fields/FieldSublabel.vue';
export default {
    name: 'EmailBlock',
    components: {
        FormElementLabel,
        FormElementSublabel
    },
    emits: ['update:label', 'update:settings', 'update:answer', 'delete', 'update:value'],
    props: {
        label: { type: String, default: 'Email' },
        placeholder: { type: String, default: 'example@example.com' },
        value: { type: String, default: '' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        answer: { type: String, default: '' },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
    data() {
        return {
            localValue: this.value,
            localLabel: this.label,
            localSubLabel: this.elSettings?.sublabel || '',
        };
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                this.$emit('update:value', this.localValue);
                this.syncBuilderState();
            }
        },
        label(v) { if (this.mode === 'builder')
            this.localLabel = v; },
        elSettings: {
            deep: true,
            handler(v) {
                if (this.mode === 'builder' && !this.isActive) {
                    this.localSubLabel = v?.sublabel || '';
                }
            }
        }
    },
    methods: {
        syncBuilderState() {
            const nextSettings = {
                ...this.elSettings,
                sublabel: this.localSubLabel,
            };
            delete nextSettings.labelKey;
            this.$emit('update:label', this.localLabel);
            this.$emit('update:settings', nextSettings);
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-EmailField.css"></style>

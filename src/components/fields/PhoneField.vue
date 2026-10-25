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
      placeholder="Phone Number"
      default-label="Phone Number"
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      <div class="input-row position-relative">
        <input
          class="field-input"
          type="tel"
          :readonly="!isActive"
        />
      </div>
    </template>

    <template v-else>
      <input
        type="tel"
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
      placeholder="Please enter a valid phone number"
      @update:modelValue="syncBuilderState"
    />

    <div v-if="isActive && mode === 'builder'" class="block-actions">
      <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
import FormElementSublabel from '@/components/fields/FieldSublabel.vue';
export default {
    name: 'PhoneBlock',
    components: {
        FormElementLabel,
        FormElementSublabel
    },
    emits: ['update:label', 'update:settings', 'update:answer', 'delete'],
    props: {
        label: { type: String, default: 'Phone Number' },
        placeholder: { type: String, default: '(000) 000-0000' },
        hint: { type: String, default: 'Please enter a valid phone number.' },
        value: { type: String, default: '' },
        mode: { type: String, default: 'builder' },
        elSettings: { type: Object, default: () => ({}) },
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

<style scoped src="@/assets/styles/components-fields-PhoneField.css"></style>

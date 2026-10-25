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
      placeholder="Number"
      default-label="Number"
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      <input
        class="number-input"
        type="number"
        :readonly="!isActive"
      />
    </template>

    <template v-else>
      <input
        type="number"
        class="fill-input"
        :class="{ 'input-error': hasError }"
        :value="answer"
        :readonly="readonly"
        @input="$emit('update:answer', $event.target.value)"
      />
    </template>

    <div v-if="isActive && mode === 'builder'" class="block-actions">
      <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'NumberBlock',
    components: {
        FormElementLabel
    },
    emits: ['update:label', 'update:settings', 'update:answer', 'delete'],
    props: {
        label: { type: String, default: 'Number' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        answer: { type: [String, Number], default: '' },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
    data() {
        return {
            localLabel: this.label,
        };
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                this.syncBuilderState();
            }
        },
        label(v) { if (this.mode === 'builder')
            this.localLabel = v; }
    },
    methods: {
        syncBuilderState() {
            const nextSettings = { ...this.elSettings };
            delete nextSettings.labelKey;
            this.$emit('update:label', this.localLabel);
            this.$emit('update:settings', nextSettings);
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-fields-NumberField.css"></style>

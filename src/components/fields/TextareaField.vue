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
      placeholder="Long Text"
      default-label="Type a question"
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      <textarea
        class="long-textarea"
        :readonly="!isActive"
      ></textarea>
    </template>

    <template v-else>
      <textarea
        class="fill-textarea"
        :class="{ 'input-error': hasError }"
        :value="answer"
        :readonly="readonly"
        @input="$emit('update:answer', $event.target.value)"
      ></textarea>
    </template>

    <div v-if="isActive && mode === 'builder'" class="block-actions">
      <button class="action-btn delete-btn" title="Delete" @click="$emit('delete')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'LongTextBlock',
    components: {
        FormElementLabel
    },
    emits: ['update:label', 'update:settings', 'update:answer', 'delete'],
    props: {
        label: { type: String, default: 'Type a question' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        answer: { type: String, default: '' },
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

<style scoped src="@/assets/styles/components-fields-TextareaField.css"></style>

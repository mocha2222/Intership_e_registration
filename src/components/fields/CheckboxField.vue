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
      placeholder="Multiple Choice"
      default-label="Multiple Choice"
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      
      <template v-if="!isActive">
        <div v-for="(opt, i) in options" :key="i" class="choice-row">
          <input type="checkbox" disabled />
          <span class="choice-text">{{ displayOptionLabel(opt) }}</span>
        </div>
      </template>

      <template v-else>
        <div v-for="(opt, i) in options" :key="i" class="choice-row edit">
          <span class="checkbox-indicator"></span>
          <input
            type="text"
            class="choice-input"
            v-model="options[i]"
            placeholder="Type option"
          />
          <span class="opt-drag">⠿</span>
          <span class="opt-remove" @click.stop="removeOption(i)">✕</span>
        </div>
        <div class="add-links mt-2">
          <span class="add-link" @click.stop="addOption">Add Option</span>
          <span class="add-link" @click.stop="addOther">Add Other Option</span>
        </div>
      </template>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      <div
        v-for="(opt, i) in (elSettings?.options || options)"
        :key="i"
        class="fill-choice-row"
        @click="toggleAnswer(opt)"
      >
        <div class="choice-checkbox" :class="{ selected: isSelected(opt), readonly: readonly }">
          <i v-if="isSelected(opt)" class="fas fa-check"></i>
        </div>
        <span class="choice-text">{{ displayOptionLabel(opt) }}</span>
        <input
          v-if="isOptOther(opt) && showOtherInput"
          v-model="selectedOtherValue"
          class="other-inline-input"
          type="text"
          placeholder="Type your answer"
          :disabled="readonly"
          @click.stop
          @mousedown.stop
          @input.stop="handleOtherInput($event.target.value)"
        />
      </div>
    </template>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'MultipleChoiceField',
    components: {
        FormElementLabel
    },
    emits: ['update:options', 'update:label', 'update:answer', 'delete', 'settings'],
    props: {
        label: { type: String, default: 'Multiple Choice' },
        initialOptions: { type: Array, default: () => ['Type option 1', 'Type option 2', 'Type option 3', 'Type option 4'] },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        answer: { type: Array, default: () => [] },
        answers: { type: Object, default: () => ({}) },
        uid: { type: [String, Number], default: '' },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
    data() {
        return {
            options: [...this.initialOptions],
            localLabel: this.label,
        };
    },
    computed: {
        otherAnswerKey() {
            return this.uid !== '' ? `el_${this.uid}_other` : '';
        },
        selectedOtherValue: {
            get() {
                return this.otherAnswerKey ? (this.answers?.[this.otherAnswerKey] || '') : '';
            },
            set(value) {
                if (!this.otherAnswerKey)
                    return;
                this.answers[this.otherAnswerKey] = value;
            },
        },
        showOtherInput() {
            return Array.isArray(this.answer) && this.answer.some(v => `${v || ''}`.trim().toLowerCase() === 'other');
        }
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                this.syncBuilderState();
                this.$emit('update:options', [...this.options]);
            }
        },
        options: {
            deep: true,
            handler(newVal) {
                if (this.isActive && this.mode === 'builder')
                    this.$emit('update:options', [...newVal]);
            }
        },
        label(v) { if (this.mode === 'builder')
            this.localLabel = v; }
    },
    methods: {
        syncBuilderState() {
            const newSettings = { ...this.elSettings };
            delete newSettings.labelKey;
            this.$emit('update:label', this.localLabel);
            this.$emit('update:settings', newSettings);
        },
        isOptOther(opt) {
            return `${opt || ''}`.trim().toLowerCase() === 'other';
        },
        displayOptionLabel(opt) {
            if (this.isOptOther(opt))
                return 'Other';
            return opt;
        },
        addOption() {
            const idx = this.options.length + 1;
            this.options.push(`Type option ${idx}`);
        },
        addOther() {
            if (this.options.some(o => this.isOptOther(o)))
                return;
            this.options.push('Other');
        },
        removeOption(index) {
            this.options.splice(index, 1);
        },
        toggleAnswer(opt) {
            if (this.readonly)
                return;
            const nextAnswer = Array.isArray(this.answer) ? [...this.answer] : [];
            const index = nextAnswer.indexOf(opt);
            if (index > -1) {
                nextAnswer.splice(index, 1);
            }
            else {
                nextAnswer.push(opt);
            }
            this.$emit('update:answer', nextAnswer);
        },
        isSelected(opt) {
            return Array.isArray(this.answer) && this.answer.includes(opt);
        },
        handleOtherInput(val) {
            this.selectedOtherValue = val;
            this.$emit('update:answer', [...this.answer]);
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-fields-CheckboxField.css"></style>
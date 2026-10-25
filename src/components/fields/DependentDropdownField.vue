<template>
  <div v-if="parentValue" class="child-dropdown-group">
    <label class="fill-child-label">{{ node.label?.trim() || fallbackLabel }}</label>
    <select
      class="fill-input child-fill-input"
      :disabled="availableOptions.length === 0"
      v-model="selectedValue"
    >
      <option value="">Select an option</option>
      <option v-for="(opt, optIdx) in availableOptions" :key="`${node.id}-${opt}-${optIdx}`" :value="opt">
        {{ displayOptionLabel(opt) }}
      </option>
    </select>
    <div v-if="showOtherInput" class="other-field-wrap">
      <label class="other-field-label">{{ isOptOther(selectedValue) ? 'Other' : selectedValue }}:</label>
      <input
        v-model="answers[otherAnswerKey]"
        class="child-other-input"
        type="text"
        placeholder="Type your answer"
        :disabled="!showOtherInput"
      />
    </div>

    <DropdownChildTreeField
      v-for="(childNode, idx) in ensuredChildren"
      v-if="answers[answerKey] && !isFillTextOption(answers[answerKey])"
      :key="childNode.id"
      :node="childNode"
      :field-id="fieldId"
      :parent-value="answers[answerKey]"
      :answers="answers"
      :fallback-label="`Child ${idx + 1}`"
    />
  </div>
</template>

<script>
export default {
    name: 'DropdownChildTreeField',
    props: {
        node: { type: Object, required: true },
        fieldId: { type: [String, Number], required: true },
        parentValue: { type: String, default: '' },
        answers: { type: Object, required: true },
        fallbackLabel: { type: String, default: 'Child' },
    },
    computed: {
        answerKey() {
            return `el_${this.fieldId}_node_${this.node.id}`;
        },
        otherAnswerKey() {
            return `${this.answerKey}_other`;
        },
        ensuredChildren() {
            return Array.isArray(this.node.children) ? this.node.children : [];
        },
        availableOptions() {
            if (!this.parentValue || !Array.isArray(this.node.mappings))
                return [];
            const mapping = this.node.mappings.find(item => item.parent === this.parentValue);
            return Array.isArray(mapping?.options) ? mapping.options : [];
        },
        selectedValue: {
            get() {
                return this.answers[this.answerKey] || '';
            },
            set(value) {
                this.answers[this.answerKey] = value;
            },
        },
        showOtherInput() {
            return this.isFillTextOption(this.selectedValue);
        },
    },
    watch: {
        parentValue() {
            this.resetDescendants();
        },
        selectedValue() {
            this.resetDescendants();
        },
    },
    methods: {
        isOptOther(opt) {
            return `${opt || ''}`.trim().toLowerCase() === 'other';
        },
        displayOptionLabel(opt) {
            return this.isOptOther(opt) ? 'Other' : opt;
        },
        isChildOtherOption(opt) {
            const normalized = `${opt || ''}`.trim().toLowerCase();
            return normalized === 'other' || normalized === 'option';
        },
        isFillTextOption(opt) {
            if (!opt)
                return false;
            if (this.isChildOtherOption(opt))
                return true;
            const types = this.node.optionTypes || {};
            return types[opt] === 'filltext';
        },
        handleOtherInput() {
            // Only force to "Other" if the current selection is not already a filltext option.
            // For custom filltext options (e.g. "tea3"), we keep the selection as-is.
            if (!this.isFillTextOption(this.answers[this.answerKey])) {
                this.answers[this.answerKey] = 'Other';
            }
        },
        resetDescendants() {
            if (!this.availableOptions.includes(this.selectedValue)) {
                this.answers[this.answerKey] = '';
                this.answers[this.otherAnswerKey] = '';
            }
            else if (!this.isFillTextOption(this.selectedValue)) {
                this.answers[this.otherAnswerKey] = '';
            }
            if (!this.isFillTextOption(this.selectedValue)) {
                this.clearNestedAnswers(this.ensuredChildren);
            }
        },
        clearNestedAnswers(nodes) {
            nodes.forEach(child => {
                this.answers[`el_${this.fieldId}_node_${child.id}`] = '';
                this.answers[`el_${this.fieldId}_node_${child.id}_other`] = '';
                if (Array.isArray(child.children) && child.children.length) {
                    this.clearNestedAnswers(child.children);
                }
            });
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-DependentDropdownField.css"></style>

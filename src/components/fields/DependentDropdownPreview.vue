<template>
  <div v-if="parentValue" class="child-preview-card mt-2">
    <div class="child-preview-header">
      <span class="child-preview-title">{{ node.label?.trim() || fallbackLabel }}</span>
      <span class="child-preview-state">
        {{ availableOptions.length ? 'Dependent options loaded' : 'No options for this selection' }}
      </span>
    </div>
    <select class="field-select" :disabled="availableOptions.length === 0" v-model="node.selected">
      <option value="">Please Select</option>
      <option v-for="(opt, optIdx) in availableOptions" :key="`${node.id}-${opt}-${optIdx}`" :value="opt">{{ displayOptionLabel(opt) }}</option>
    </select>
    <input
      v-if="isFillTextOption(node.selected)"
      v-model="node.otherValue"
      class="field-select other-preview-input"
      type="text"
      placeholder="Type your answer"
    />

    <DropdownChildTreePreview
      v-for="(childNode, idx) in ensuredChildren"
      v-if="node.selected && !isFillTextOption(node.selected)"
      :key="childNode.id"
      :node="childNode"
      :parent-value="node.selected"
      :fallback-label="$label('editor.dropdownTree.childFallback', { index: idx + 1 })"
    />
  </div>
</template>

<script>
export default {
    name: 'DropdownChildTreePreview',
    props: {
        node: { type: Object, required: true },
        parentValue: { type: String, default: '' },
        fallbackLabel: { type: String, default: 'Child' },
    },
    computed: {
        ensuredChildren() {
            return Array.isArray(this.node.children) ? this.node.children : [];
        },
        availableOptions() {
            if (!this.parentValue || !Array.isArray(this.node.mappings))
                return [];
            const mapping = this.node.mappings.find(item => item.parent === this.parentValue);
            return Array.isArray(mapping?.options) ? mapping.options : [];
        },
    },
    watch: {
        parentValue() {
            this.resetIfInvalid();
        },
    },
    methods: {
        isOptOther(opt) {
            return `${opt || ''}`.trim().toLowerCase() === 'other';
        },
        displayOptionLabel(opt) {
            return this.isChildOtherOption(opt) ? 'Other' : opt;
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
        resetIfInvalid() {
            if (!this.availableOptions.includes(this.node.selected)) {
                this.node.selected = '';
            }
            this.ensuredChildren.forEach(child => {
                if (!this.node.selected)
                    child.selected = '';
            });
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-DependentDropdownPreview.css"></style>

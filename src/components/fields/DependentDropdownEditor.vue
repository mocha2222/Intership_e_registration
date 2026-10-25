<template>
  <div class="node-editor" :class="{ nested: depth > 0 }">
    <div class="node-header">
      <div>
        <strong>{{ displayLabel }}</strong>
        <p class="node-summary">Each parent option gets its own child option list.</p>
      </div>
      <button v-if="showRemove" class="inline-delete-btn" @click.stop="$emit('remove')" title="Remove child">Remove</button>
    </div>

    <div class="child-name-row">
      <label class="mapping-label" :for="`child-label-${node.id}`">Child field label</label>
      <input
        :id="`child-label-${node.id}`"
        v-model="node.label"
        class="mapping-input"
        type="text"
        placeholder="Type child dropdown label"
        @click.stop
        @input="emitChanged"
      />
    </div>

    <div v-if="filteredParentOptions.length" class="mapping-grid">
      <div
        v-for="parentOption in filteredParentOptions"
        :key="`${node.id}-${parentOption}`"
        class="mapping-row"
      >
        <div class="mapping-parent">
          <span class="mapping-label">When parent is</span>
          <span class="mapping-badge">{{ parentOption }}</span>
        </div>
        <div class="mapping-editor">
          <div v-if="getMappingOptions(parentOption).length" class="option-chip-list">
            <span
              v-for="(option, optionIdx) in getMappingOptions(parentOption)"
              :key="`${parentOption}-${option}-${optionIdx}`"
              class="option-chip"
              :class="{ 'filltext-chip': node.optionTypes?.[option] === 'filltext' }"
            >
              {{ option }} <span class="chip-type-badge">{{ node.optionTypes?.[option] === 'filltext' ? '(Text)' : '(Drop)' }}</span>
              <button
                class="chip-remove-btn"
                @click.stop="removeChildOption(parentOption, optionIdx)"
                title="Remove child option"
              >
                ×
              </button>
            </span>
          </div>
          <p v-else class="empty-mapping">No child options yet.</p>
          <div class="mapping-input-row" style="display: flex; gap: 6px; align-items: center;">
            <input
              :value="getDraftValue(parentOption)"
              class="mapping-input"
              type="text"
              placeholder="Type a child option"
              @click.stop
              @input="setDraftValue(parentOption, $event.target.value)"
              @keyup.enter.prevent="addChildOption(parentOption, 'dropdown')"
            />
            <button class="secondary-btn add-btn-dropdown" @click.stop="addChildOption(parentOption, 'dropdown')" title="Add as a child dropdown option">+ Dropdown</button>
            <button class="secondary-btn add-btn-filltext" @click.stop="addChildOption(parentOption, 'filltext')" title="Add as a text field input">+ Fill Text</button>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="empty-mapping">Add parent options first to configure child mappings.</p>

    <div class="nested-children">
      <div v-for="(childNode, idx) in ensuredChildren" :key="childNode.id" class="nested-child-wrap">
        <DropdownChildTreeEditor
          :node="childNode"
          :parent-options="getNodeOptions()"
          :parent-option-types="node.optionTypes || {}"
          :depth="depth + 1"
          :show-remove="true"
          @changed="emitChanged"
          @remove="removeNestedChild(idx)"
        />
      </div>
      <button
        class="secondary-btn"
        :disabled="getNodeOptions().length === 0"
        @click.stop="addNestedChild"
      >
        Add nested child
      </button>
    </div>
  </div>
</template>

<script>
export default {
    name: 'DropdownChildTreeEditor',
    emits: ['changed', 'remove', 'structure-changed'],
    props: {
        node: { type: Object, required: true },
        parentOptions: { type: Array, default: () => [] },
        parentOptionTypes: { type: Object, default: () => ({}) },
        depth: { type: Number, default: 0 },
        showRemove: { type: Boolean, default: false },
    },
    computed: {
        displayLabel() {
            return this.node.label?.trim() || this.$label('editor.dropdownTree.childFallback', { index: this.depth + 1 });
        },
        ensuredChildren() {
            if (!Array.isArray(this.node.children)) {
                this.node.children = [];
            }
            return this.node.children;
        },
        filteredParentOptions() {
            const opts = Array.isArray(this.parentOptions) ? this.parentOptions : [];
            const types = this.parentOptionTypes || {};
            return opts.filter(option => {
                if (this.isOtherOption(option))
                    return false;
                if (types[option] === 'filltext')
                    return false;
                return true;
            });
        },
    },
    watch: {
        parentOptions: {
            deep: true,
            immediate: true,
            handler() {
                this.normalizeMappings();
            },
        },
    },
    methods: {
        isOtherOption(option) {
            return `${option || ''}`.trim().toLowerCase() === 'other';
        },
        emitChanged() {
            this.$emit('changed');
        },
        normalizeMappings() {
            const byParent = new Map();
            const sourceMappings = Array.isArray(this.node.mappings) ? this.node.mappings : [];
            sourceMappings.forEach(mapping => {
                const parent = typeof mapping?.parent === 'string' ? mapping.parent.trim() : '';
                if (!parent)
                    return;
                const options = Array.isArray(mapping.options)
                    ? [...new Set(mapping.options.map(option => this.normalizeChildOption(option)).filter(Boolean))]
                    : [];
                byParent.set(parent, { parent, options });
            });
            this.node.mappings = this.filteredParentOptions.map(parentOption => (byParent.get(parentOption) || { parent: parentOption, options: [] }));
            this.emitChanged();
        },
        getMapping(parentOption) {
            return this.node.mappings.find(mapping => mapping.parent === parentOption);
        },
        getMappingOptions(parentOption) {
            return this.getMapping(parentOption)?.options || [];
        },
        getDraftValue(parentOption) {
            if (!this.node.drafts)
                this.node.drafts = {};
            return this.node.drafts[parentOption] || '';
        },
        setDraftValue(parentOption, value) {
            this.node.drafts = {
                ...(this.node.drafts || {}),
                [parentOption]: value,
            };
        },
        normalizeChildOption(option) {
            const trimmed = `${option ?? ''}`.trim();
            if (!trimmed)
                return '';
            return this.isOtherOption(trimmed) || trimmed.toLowerCase() === 'option' ? 'Other' : trimmed;
        },
        addChildOption(parentOption, type = 'dropdown') {
            const draftValue = this.normalizeChildOption(this.getDraftValue(parentOption));
            if (!draftValue)
                return;
            const mapping = this.getMapping(parentOption);
            if (!mapping)
                return;
            if (!mapping.options.includes(draftValue)) {
                mapping.options.push(draftValue);
            }
            if (!this.node.optionTypes) {
                this.node.optionTypes = {};
            }
            this.node.optionTypes[draftValue] = type;
            this.setDraftValue(parentOption, '');
            this.emitChanged();
        },
        removeChildOption(parentOption, idx) {
            const mapping = this.getMapping(parentOption);
            if (!mapping)
                return;
            const removedOpt = mapping.options[idx];
            mapping.options.splice(idx, 1);
            // Clean up type if no other mapping uses it
            const stillUsed = this.node.mappings.some(m => m.options.includes(removedOpt));
            if (!stillUsed && this.node.optionTypes) {
                delete this.node.optionTypes[removedOpt];
            }
            this.emitChanged();
        },
        getNodeOptions() {
            const values = this.node.mappings.flatMap(mapping => Array.isArray(mapping.options) ? mapping.options : []);
            return [...new Set(values)];
        },
        addNestedChild() {
            this.ensuredChildren.push({
                id: Date.now() + Math.random(),
                label: '',
                mappings: this.getNodeOptions().map(parent => ({ parent, options: [] })),
                drafts: {},
                children: [],
                optionTypes: {},
            });
            this.emitChanged();
            this.$emit('structure-changed');
        },
        removeNestedChild(idx) {
            this.ensuredChildren.splice(idx, 1);
            this.emitChanged();
            this.$emit('structure-changed');
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-DependentDropdownEditor.css"></style>
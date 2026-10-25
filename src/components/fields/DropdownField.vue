<template>
  <div
    class="block-wrapper"
    :class="{ 'edit-mode': isActive && mode === 'builder', 'public-mode': mode === 'public' }"
  >
    
    <template v-if="mode === 'builder'">
      <FormElementLabel
        v-model="localLabel"
        :label-key="elSettings?.labelKey"
        :is-active="isActive"
        :mode="mode"
        placeholder="Dropdown"
        default-label="Type a question"
        @edit="updateSettings"
      />

      <select class="field-select" v-model="selectedValue">
        <option value=""></option>
        <option v-for="(opt, optIdx) in options" :key="`${opt}-${optIdx}`" :value="opt">{{ displayOptionLabel(opt) }}</option>
      </select>
      <input
        v-if="isFillTextOption(selectedValue)"
        v-model="selectedOtherValue"
        class="other-input"
        type="text"
        placeholder="Type your answer"
      />

      <div v-if="children.length" class="mt-2 child-dropdowns">
        <DropdownChildTreePreview
          v-for="(child, idx) in children"
          :key="child.id"
          :node="child"
          :parent-value="selectedValue"
          :fallback-label="$label('editor.dropdownTree.childFallback', { index: idx + 1 })"
        />
      </div>

      <FormElementSublabel
        v-model="sublabel"
        :is-active="isActive"
        :mode="mode"
        placeholder="Type a sublabel"
        @update:modelValue="updateSettings"
      />

      <template v-if="isActive">
        <div class="mt-2">
          <p class="hint-text">Edit options (one per line):</p>
          <div class="option-chip-list mt-2">
            <span
              v-for="(opt, optIdx) in options"
              :key="`${opt}-${optIdx}`"
              class="option-chip"
              :class="{ 'filltext-chip': optionTypes?.[opt] === 'filltext' }"
            >
              {{ opt }} <span class="chip-type-badge">{{ optionTypes?.[opt] === 'filltext' ? '(Text)' : '(Drop)' }}</span>
              <button class="chip-remove-btn" @click.stop="removeParentOption(optIdx)">×</button>
            </span>
          </div>
          <div class="mapping-input-row mt-2" style="display: flex; gap: 6px; align-items: center;">
            <input
              v-model="newOptionText"
              class="mapping-input"
              type="text"
              placeholder="Type an option"
              @click.stop
              @keyup.enter.prevent="addParentOption('dropdown')"
            />
            <button class="secondary-btn add-btn-dropdown" @click.stop="addParentOption('dropdown')">+ Dropdown</button>
            <button class="secondary-btn add-btn-filltext" @click.stop="addParentOption('filltext')">+ Fill Text</button>
          </div>
          <div class="add-links mt-2">
            <span class="add-link" @click.stop="addOtherOption">Add Other Option</span>
          </div>
        </div>
        <div class="mt-3">
          <p class="hint-text">Child dropdowns (dependent on parent selection):</p>
          <DropdownChildTreeEditor
            v-for="(child, idx) in children"
            :key="child.id"
            :node="child"
            :parent-options="options"
            :parent-option-types="optionTypes"
            :depth="0"
            :show-remove="true"
            @changed="updateSettings"
            @structure-changed="commitSettings"
            @remove="removeChild(idx)"
          />
          <div class="mt-2">
            <button class="secondary-btn" @click.stop="addChild">Add child dropdown</button>
          </div>
        </div>
      </template>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      <FormElementLabel
        v-model="localLabel"
        :label-key="elSettings?.labelKey"
        :is-active="isActive"
        :mode="mode"
        placeholder="Dropdown"
        default-label="Type a question"
      />
      <select
        class="fill-input"
        :class="{ 'input-error': hasError }"
        :value="answer"
        :disabled="readonly"
        @change="handlePublicChange($event.target.value)"
      >
        <option value="" disabled selected></option>
        <option v-for="(opt, i) in (elSettings?.options || options)" :key="i" :value="opt">
          {{ displayOptionLabel(opt) }}
        </option>
      </select>
      <div v-if="showOtherInput" class="other-field-wrap">
        <label class="other-field-label">{{ isOtherValue(answer) ? 'Other' : answer }}:</label>
        <input
          v-model="answers[otherAnswerKey]"
          class="other-fill-input"
          type="text"
          placeholder="Type your answer"
          :disabled="readonly"
        />
      </div>
      <FormElementSublabel
        :model-value="elSettings?.sublabel"
        :is-active="isActive"
        :mode="mode"
      />

      <template v-if="answer && !isFillTextOption(answer)">
        <DropdownChildTreeField
          v-for="(child, childIdx) in (elSettings?.childDropdowns || [])"
          :key="child.id || childIdx"
          :node="child"
          :field-id="uid"
          :parent-value="answer"
          :answers="answers"
          :fallback-label="`Child ${childIdx + 1}`"
        />
      </template>
    </template>
  </div>
</template>

<script>
import DropdownChildTreeEditor from '@/components/fields/DependentDropdownEditor.vue';
import DropdownChildTreePreview from '@/components/fields/DependentDropdownPreview.vue';
import DropdownChildTreeField from '@/components/fields/DependentDropdownField.vue';
import FormElementLabel from '@/components/fields/FieldLabel.vue';
import FormElementSublabel from '@/components/fields/FieldSublabel.vue';
export default {
    name: 'DropdownField',
    components: {
        DropdownChildTreeEditor,
        DropdownChildTreePreview,
        DropdownChildTreeField,
        FormElementLabel,
        FormElementSublabel
    },
    emits: ['update:label', 'update:options', 'update:settings', 'delete', 'update:answer', 'commit'],
    props: {
        label: { type: String, default: 'Dropdown' },
        initialOptions: { type: Array, default: () => ['option 1', 'option 2', 'option 3'] },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        answer: { type: String, default: '' },
        answers: { type: Object, default: () => ({}) },
        uid: { type: [String, Number], default: '' },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
    data() {
        return {
            localLabel: this.label,
            options: [...this.initialOptions],
            optionsText: this.initialOptions.join('\n'),
            sublabel: this.elSettings?.sublabel || '',
            selectedValue: '',
            children: this.initializeChildren(this.elSettings?.childDropdowns),
            newOptionText: '',
            optionTypes: this.elSettings?.optionTypes ? { ...this.elSettings.optionTypes } : {},
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
            return this.isFillTextOption(this.answer);
        },
        displayLabel() {
            if (this.elSettings?.labelKey) {
                const fallback = this.$label(this.elSettings.labelKey);
                if (this.localLabel === this.label && (this.label === 'Dropdown' || this.label === fallback)) {
                    return fallback;
                }
            }
            return this.localLabel || 'elements.dropDown';
        }
    },
    watch: {
        isActive(val) {
            if (this.mode === 'builder') {
                if (!val) {
                    const newSettings = {
                        ...this.elSettings,
                        sublabel: this.sublabel,
                        optionTypes: { ...this.optionTypes },
                        childDropdowns: this.children.map(child => this.serializeChildNode(child))
                    };
                    delete newSettings.labelKey;
                    this.$emit('update:settings', newSettings);
                    this.$emit('update:label', this.localLabel);
                    this.$emit('update:options', [...this.options]);
                    this.$emit('commit');
                }
                else {
                    this.optionsText = this.options.join('\n');
                }
            }
        },
        optionsText(newVal) {
            if (this.mode === 'builder') {
                this.options = newVal
                    .split('\n')
                    .map(s => s.trim())
                    .filter(Boolean);
                this.syncChildrenWithOptions();
                if (this.isActive) {
                    this.$emit('update:options', [...this.options]);
                }
            }
        },
        label(newVal) { if (this.mode === 'builder' && this.localLabel !== newVal)
            this.localLabel = newVal; },
        initialOptions: {
            deep: true,
            handler(newVal) {
                if (this.mode === 'builder' && !this.isActive) {
                    this.options = Array.isArray(newVal) ? [...newVal] : [];
                    this.optionsText = this.options.join('\n');
                    this.syncChildrenWithOptions();
                }
            }
        },
        elSettings: {
            deep: true,
            handler(newVal) {
                if (this.mode === 'builder' && !this.isActive) {
                    this.sublabel = newVal?.sublabel || '';
                    this.children = this.initializeChildren(newVal?.childDropdowns);
                    this.optionTypes = newVal?.optionTypes ? { ...newVal.optionTypes } : {};
                }
            }
        },
        children: {
            deep: true,
            handler() {
                if (this.isActive && this.mode === 'builder')
                    this.updateSettings();
            }
        },
        sublabel() {
            if (this.isActive && this.mode === 'builder')
                this.updateSettings();
        },
        selectedValue() {
            this.children.forEach(child => {
                const availableOptions = this.getChildOptions(child);
                if (!availableOptions.includes(child.selected)) {
                    child.selected = '';
                }
            });
        }
    },
    methods: {
        isOtherValue(value) {
            return `${value || ''}`.trim().toLowerCase() === 'other';
        },
        isFillTextOption(value) {
            if (!value)
                return false;
            if (this.isOtherValue(value))
                return true;
            const types = this.optionTypes || this.elSettings?.optionTypes || {};
            return types[value] === 'filltext';
        },
        isOptOther(opt) {
            return `${opt || ''}`.trim().toLowerCase() === 'other';
        },
        displayOptionLabel(opt) {
            return this.isOptOther(opt) ? 'Other' : opt;
        },
        handlePublicChange(val) {
            if (this.otherAnswerKey && !this.isFillTextOption(val)) {
                this.answers[this.otherAnswerKey] = '';
            }
            this.$emit('update:answer', val);
        },
        addParentOption(type = 'dropdown') {
            const val = this.newOptionText.trim();
            if (!val)
                return;
            if (!this.options.includes(val)) {
                this.options = [...this.options, val];
            }
            // Update local state type
            this.optionTypes[val] = type;
            this.newOptionText = '';
            this.syncChildrenWithOptions();
            this.$emit('update:options', [...this.options]);
            this.updateSettings();
            this.$emit('commit');
        },
        removeParentOption(idx) {
            const val = this.options[idx];
            const newOptions = [...this.options];
            newOptions.splice(idx, 1);
            this.options = newOptions;
            // Update local state
            delete this.optionTypes[val];
            this.syncChildrenWithOptions();
            this.$emit('update:options', [...this.options]);
            this.updateSettings();
            this.$emit('commit');
        },
        addOtherOption() {
            if (this.options.some(o => `${o || ''}`.trim().toLowerCase() === 'other'))
                return;
            this.options = [...this.options, 'Other'];
            // Update local state
            this.optionTypes['Other'] = 'filltext';
            this.syncChildrenWithOptions();
            this.$emit('update:options', [...this.options]);
            this.updateSettings();
            this.$emit('commit');
        },
        initializeChildren(config = []) {
            return this.buildChildTree(config, this.getCurrentOptions());
        },
        getCurrentOptions() {
            if (Array.isArray(this.options))
                return this.options;
            if (Array.isArray(this.initialOptions))
                return this.initialOptions;
            return [];
        },
        createChildModel(child = {}, parentOptions = this.getCurrentOptions()) {
            const mappings = this.normalizeMappings(child.mappings, parentOptions);
            return {
                id: child.id ?? (Date.now() + Math.random()),
                label: typeof child.label === 'string' ? child.label : '',
                mappings,
                selected: '',
                drafts: {},
                optionTypes: child.optionTypes ? { ...child.optionTypes } : {},
                children: this.buildChildTree(child.children, this.collectNodeOptions(mappings)),
            };
        },
        buildChildTree(config = [], parentOptions = this.getCurrentOptions()) {
            if (!Array.isArray(config))
                return [];
            return config.map(child => this.createChildModel(child, parentOptions));
        },
        normalizeMappings(mappings = [], parentOptions = this.getCurrentOptions()) {
            const byParent = new Map();
            mappings.forEach(mapping => {
                const parent = typeof mapping?.parent === 'string' ? mapping.parent.trim() : '';
                if (!parent)
                    return;
                const uniqueOptions = Array.isArray(mapping.options)
                    ? [...new Set(mapping.options.map(option => `${option ?? ''}`.trim()).filter(Boolean))]
                    : [];
                byParent.set(parent, { parent, options: uniqueOptions });
            });
            return parentOptions
                .filter(parentOption => !this.isOptOther(parentOption))
                .map(parentOption => byParent.get(parentOption) || { parent: parentOption, options: [] });
        },
        collectNodeOptions(mappings = []) {
            const values = mappings.flatMap(mapping => Array.isArray(mapping.options) ? mapping.options : []);
            return [...new Set(values)];
        },
        syncChildTree(nodes = [], parentOptions = this.getCurrentOptions(), activeParentValue = '') {
            return nodes.map(child => {
                const normalizedMappings = this.normalizeMappings(child.mappings, parentOptions);
                const nextDrafts = {};
                normalizedMappings.forEach(mapping => {
                    nextDrafts[mapping.parent] = child.drafts?.[mapping.parent] || '';
                });
                const selectedOptions = activeParentValue
                    ? normalizedMappings.find(mapping => mapping.parent === activeParentValue)?.options || []
                    : [];
                const nextSelected = selectedOptions.includes(child.selected) ? child.selected : '';
                const childParentOptions = this.collectNodeOptions(normalizedMappings);
                return {
                    ...child,
                    mappings: normalizedMappings,
                    drafts: nextDrafts,
                    selected: nextSelected,
                    children: this.syncChildTree(child.children || [], childParentOptions, nextSelected),
                };
            });
        },
        syncChildrenWithOptions() {
            this.children = this.syncChildTree(this.children, this.getCurrentOptions(), this.selectedValue);
            if (this.isActive && this.mode === 'builder')
                this.updateSettings();
        },
        addChild() {
            this.children.push(this.createChildModel());
            void this.commitSettings();
        },
        removeChild(idx) {
            this.children.splice(idx, 1);
            void this.commitSettings();
        },
        getChildOptions(child) {
            if (!child.mappings || !this.selectedValue)
                return [];
            const m = child.mappings.find(x => x.parent === this.selectedValue);
            return m ? m.options : [];
        },
        getAnswerDisplayValue() {
            if (!this.isOtherValue(this.answer))
                return this.answer;
            return this.selectedOtherValue.trim() || this.answer;
        },
        serializeChildNode(node) {
            return {
                id: node.id,
                label: node.label?.trim() || '',
                mappings: (node.mappings || [])
                    .filter(mapping => !this.isOptOther(mapping.parent))
                    .map(mapping => ({
                    parent: mapping.parent,
                    options: [...mapping.options],
                }))
                    .filter(mapping => mapping.parent),
                optionTypes: node.optionTypes ? { ...node.optionTypes } : {},
                children: Array.isArray(node.children)
                    ? node.children.map(child => this.serializeChildNode(child))
                    : [],
            };
        },
        updateSettings() {
            const newSettings = { ...this.elSettings };
            newSettings.sublabel = this.sublabel;
            newSettings.optionTypes = { ...this.optionTypes };
            newSettings.childDropdowns = this.children.map(child => this.serializeChildNode(child));
            this.$emit('update:settings', newSettings);
        },
        commitSettings() { this.$emit('commit'); }
    },
    mounted() {
        if (this.mode === 'builder') {
            this.optionsText = this.options.join('\n');
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-fields-DropdownField.css"></style>

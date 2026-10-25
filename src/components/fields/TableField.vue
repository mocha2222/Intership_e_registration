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
      placeholder="elements.tableInput"
      default-label="Input Table"
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      <div class="table-scroll">
        <table class="survey-table">
          <thead>
            <tr>
              <th class="row-header-cell"></th>
              <th v-for="(col, ci) in columns" :key="ci" class="col-header-cell">
                <span v-if="!isActive">{{ col }}</span>
                <div v-else class="col-edit">
                  <input v-model="columns[ci]" class="cell-input" @click.stop />
                  <button class="remove-btn" @click.stop="removeColumn(ci)">×</button>
                </div>
              </th>
              <th v-if="isActive" class="add-col-cell">
                <span class="add-col-btn" @click.stop="addColumn">Add Column</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in rows" :key="ri">
              <td class="row-label-cell">
                <span v-if="!isActive">{{ row }}</span>
                <div v-else class="row-edit">
                  <input v-model="rows[ri]" class="cell-input" @click.stop />
                  <button class="remove-btn" @click.stop="removeRow(ri)">×</button>
                </div>
              </td>
              <td 
                v-for="(col, ci) in columns" :key="ci" 
                class="radio-cell"
              >
                <input 
                  type="radio" 
                  disabled
                />
              </td>
              <td v-if="isActive" class="add-col-cell"></td>
            </tr>
          </tbody>
        </table>
        <button v-if="isActive" class="add-row-btn" @click.stop="addRow">Add Row</button>
      </div>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="table-scroll" :class="{ 'error-border': hasError }">
        <table class="survey-table public">
          <thead>
            <tr>
              <th class="row-header-cell"></th>
              <th v-for="(col, ci) in columns" :key="ci" class="col-header-cell">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in rows" :key="ri">
              <td class="row-label-cell">
                {{ row }}
              </td>
              <td 
                v-for="(col, ci) in columns" :key="ci" 
                class="radio-cell"
                :class="{ 'clickable-cell': !readonly }"
                @click="!readonly && updateAnswer(row, col)"
              >
                <div class="choice-radio" :class="{ selected: isSelected(row, col), readonly: readonly }">
                  <div v-if="isSelected(row, col)" class="radio-inner"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'TableInputBlock',
    components: {
        FormElementLabel
    },
    emits: ['update:label', 'update:settings', 'update:answer', 'update:columns', 'update:rows', 'delete', 'settings'],
    props: {
        elSettings: { type: Object, default: () => ({}) },
        label: { type: String, default: 'Input Table' },
        initialColumns: { type: Array, default: () => null },
        initialRows: { type: Array, default: () => null },
        mode: { type: String, default: 'builder' },
        answer: { type: Object, default: () => ({}) },
        isActive: { type: Boolean, default: false },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
    data() {
        return {
            localLabel: this.label,
            columns: [...(this.initialColumns || this.elSettings?.columns || ['Column' + ' 1', 'Column' + ' 2'])],
            rows: [...(this.initialRows || this.elSettings?.rows || ['Row' + ' 1', 'Row' + ' 2'])],
        };
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                this.syncBuilderState();
                this.$emit('update:columns', [...this.columns]);
                this.$emit('update:rows', [...this.rows]);
            }
        },
        label(v) { if (this.mode === 'builder')
            this.localLabel = v; },
        initialColumns(v) { if (this.mode === 'builder' && !this.isActive && v)
            this.columns = [...v]; },
        initialRows(v) { if (this.mode === 'builder' && !this.isActive && v)
            this.rows = [...v]; },
    },
    methods: {
        syncBuilderState() {
            const newSettings = { ...this.elSettings };
            delete newSettings.labelKey;
            this.$emit('update:label', this.localLabel);
            this.$emit('update:settings', newSettings);
        },
        addColumn() { this.columns.push('Column' + ' ' + (this.columns.length + 1)); },
        removeColumn(i) { this.columns.splice(i, 1); },
        addRow() { this.rows.push('Row' + ' ' + (this.rows.length + 1)); },
        removeRow(i) { this.rows.splice(i, 1); },
        isSelected(row, col) {
            return this.answer && this.answer[row] === col;
        },
        updateAnswer(row, col) {
            if (this.readonly)
                return;
            const newAnswer = { ...(this.answer || {}) };
            newAnswer[row] = col;
            this.$emit('update:answer', newAnswer);
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-TableField.css"></style>
<template>
  <div class="responses-table-wrapper">

    <div class="toolbar jf-table-toolbar d-flex align-items-center flex-wrap gap-2 px-3 py-2">
      
      <div class="toolbar-left d-flex align-items-center gap-2">
        <button class="btn-back" @click="$router.push('/home')" title="Back">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="form-title-bar">{{ formTitle }}</span>
      </div>

      <div class="toolbar-actions ms-auto">
        
        <button v-if="attendanceEnabled" class="nav-btn-green scan-btn" @click="$router.push('/scan')">
          <i class="bi bi-qr-code-scan me-1"></i>Scan QR
        </button>

        <button class="nav-btn-green edit-btn" @click="$router.push({ name: 'formEditor', params: { id: formId } })">
          <i class="bi bi-pencil-square me-1"></i>Edit
        </button>

        <ResponseFilters v-model="search" />

        <div class="position-relative filter-wrap" ref="filterWrap">
          <button class="ctrl-btn" @click="showFilter = !showFilter">
            <i class="bi bi-funnel-fill me-1"></i>
            <span class="ctrl-btn-label">{{ activeFilterLabel }}</span>
            <i class="bi ms-1" :class="showFilter ? 'bi-chevron-up' : 'bi-chevron-down'" style="font-size: 0.625rem;"></i>
          </button>
          <div v-if="showFilter" class="filter-dropdown">
            <a href="#" class="filter-item" :class="{ active: filterColumn === '' }" @click.prevent="setFilter('', '')">All Columns</a>
            <a v-for="col in columns" :key="col.key" href="#" class="filter-item" :class="{ active: filterColumn === col.key }" @click.prevent="setFilter(col.key, col.label)">
              <i :class="colIcon(col.type) + ' me-1'"></i>{{ col.label }}
            </a>
          </div>
        </div>

        <div v-if="checkedCount > 0" class="bulk-actions d-flex align-items-center gap-2 ms-2">
          <span class="selected-badge">{{ $label('responses.selected', { count: checkedCount }) }}</span>
          <button class="ctrl-btn text-danger" @click="deleteSelected">
            <i class="bi bi-trash me-1"></i>Delete
          </button>
        </div>

        <div class="download-wrap d-flex align-items-center gap-2 position-relative" ref="downloadWrap">
          <button class="download-btn" :disabled="isExporting" @click="showDownload = !showDownload">
            <template v-if="isExporting">
              <span class="spinner-border spinner-border-sm me-1"></span>
              <span class="download-label">Exporting...</span>
            </template>
            <template v-else>
              <i class="bi bi-download me-1"></i>
              <span class="download-label">Download</span>
            </template>
          </button>

          <div v-if="showDownload" class="filter-dropdown download-dropdown-menu">
            <a href="#" class="filter-item" @click.prevent="downloadPDF">
              <i class="bi bi-file-earmark-pdf me-2 text-danger"></i>PDF (Report)
            </a>
            <a href="#" class="filter-item" @click.prevent="downloadExcel">
              <i class="bi bi-file-earmark-excel me-2 text-success"></i>Excel (Data)
            </a>
            <div class="dropdown-divider m-0"></div>
            <a href="#" class="filter-item" @click.prevent="downloadCSV">
              <i class="bi bi-file-earmark-text me-2 text-muted"></i>CSV (Raw)
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="table-scroll" ref="tableWrap">
      <table class="jf-table">
        <thead>
          <tr>
            <th class="th-check"><input type="checkbox" v-model="allChecked" @change="toggleAll" /></th>
            <th class="th-num">#</th>
            <th class="th-cell sortable" @click="toggleSort('submittedAt')">
              <i class="bi bi-calendar3 me-1 text-muted"></i> Submission Date
              <i v-if="sortKey === 'submittedAt'" class="bi ms-auto" :class="sortOrder === 'asc' ? 'bi-sort-up' : 'bi-sort-down-alt'"></i>
              <i v-else class="bi bi-sort-alpha-down ms-auto text-muted opacity-25"></i>
            </th>
            <th v-for="col in columns" :key="col.key" class="th-cell sortable" @click="toggleSort(col.key)">
              <i :class="colIcon(col.type) + ' me-1 text-muted'"></i>
              {{ col.label }}
              <i v-if="sortKey === col.key" class="bi ms-auto" :class="sortOrder === 'asc' ? 'bi-sort-up' : 'bi-sort-down-alt'"></i>
              <i v-else class="bi bi-sort-alpha-down ms-auto text-muted opacity-25"></i>
            </th>
            <th class="th-action">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredRows.length === 0">
            <td :colspan="4 + columns.length" class="empty-row">No submissions found.</td>
          </tr>
          <tr v-for="(row, i) in filteredRows" :key="row.id" class="data-row" :class="{ 'is-editing': editingRowId === row.id }">
            <td class="th-check"><input type="checkbox" v-model="row._checked" /></td>
            <td class="td-num">{{ i + 1 }}</td>
            <td class="td-cell">{{ row.submittedAt }}</td>
            <td v-for="col in columns" :key="col.key" class="td-cell">
              
              <template v-if="editingRowId === row.id">
                <template v-if="col.type === 'fileupload' || col.type === 'image'">
                  <div class="text-muted small italic">
                    <i class="bi bi-lock-fill me-1"></i> {{ getFileName(row[col.key]) || 'No File' }}
                  </div>
                </template>
                <template v-else-if="col.key === 'status'">
                  <select v-model="editForm.status" class="jf-edit-input form-select form-select-sm">
                    <option value="pending">Pending</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </template>
                <template v-else-if="col.key === 'checkInTime'">
                  <span class="text-muted small">{{ row[col.key] || '-' }}</span>
                </template>
                <template v-else-if="col.type === 'paragraph'">
                  <textarea v-model="editForm[col.key]" class="jf-edit-input form-control form-control-sm" rows="2"></textarea>
                </template>
                <template v-else>
                  <input v-model="editForm[col.key]" class="jf-edit-input form-control form-control-sm" />
                </template>
              </template>

              <template v-else>
                <template v-if="col.type === 'fileupload' || col.type === 'image'">
                  <template v-if="hasFile(row[col.key])">
                    <div v-for="file in getFiles(row[col.key])" :key="file.fileUrl || file.data || file.fileName || file.name">
                      <a :href="getFileData(file)" target="_blank" class="text-primary text-decoration-underline">
                        <i class="bi bi-eye me-1"></i> {{ file.fileName || file.name || 'Download' }}
                      </a>
                    </div>
                  </template>
                  <template v-else>
                    {{ row[col.key] || '' }}
                  </template>
                </template>
                <template v-else-if="col.key === 'status'">
                   {{ row.status || 'pending' }}
                </template>
                <template v-else-if="col.type === 'paragraph'">
                  <div class="text-truncate" style="max-width: 15.625rem;" :title="stripHtml(row[col.key])">
                    {{ stripHtml(row[col.key]) }}
                  </div>
                </template>
                <template v-else>
                  {{ row[col.key] || '' }}
                </template>
              </template>
            </td>
            <td class="td-action">
              <div class="action-btn-group">
                <template v-if="editingRowId === row.id">
                  <button class="btn-action-row text-success" @click.stop="saveEdit(row.id)" title="Save">
                    <i class="bi bi-check-lg"></i>
                  </button>
                  <button class="btn-action-row text-secondary" @click.stop="cancelEdit" title="Cancel">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </template>
                <template v-else>
                  <button class="btn-action-row text-primary" @click.stop="startEdit(row)" title="Edit">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn-action-row text-danger" @click.stop="deleteRow(row.id)" title="Delete">
                    <i class="bi bi-trash"></i>
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filteredRows.length > 0" class="summary-footer-fixed">
      <div class="summary-inner d-flex align-items-center justify-content-between px-3">
        <div class="summary-left">
          <i class="bi bi-calculator me-2"></i> Total Response: <strong>{{ summary.total }}</strong>
        </div>
        <div v-if="attendanceEnabled" class="summary-right d-flex align-items-center gap-2 gap-sm-3">
          <span class="summary-pill present">
            <i class="bi bi-check-circle-fill me-1"></i> <span class="d-none d-sm-inline">Total Present: </span><strong>{{ summary.present }}</strong>
          </span>
          <span class="summary-pill late">
            <i class="bi bi-clock-fill me-1"></i> <span class="d-none d-sm-inline">Total Late: </span><strong>{{ summary.late }}</strong>
          </span>
          <span class="summary-pill pending">
            <i class="bi bi-hourglass-split me-1"></i> <span class="d-none d-sm-inline">Total Pending: </span><strong>{{ summary.pending }}</strong>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { downloadCSV as exportCSV, responseMatrix } from "@/utils/exportResponses";
import ResponseFilters from "@/components/responses/ResponseFilters.vue";
import { API_BASE_URL } from '@/api/http';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { updateResponse } from '@/api/responsesApi';
export default {
    components: { ResponseFilters },
    name: 'ResponsesTable',
    props: {
        columns: { type: Array, default: () => [] },
        submissions: { type: Array, default: () => [] },
        formId: { type: String, default: '' },
        formTitle: { type: String, default: 'Untitled Form' },
        attendanceEnabled: { type: Boolean, default: false },
    },
    emits: ['delete-submission'],
    data() {
        return {
            search: '',
            allChecked: false,
            showFilter: false,
            showDownload: false,
            isExporting: false,
            filterColumn: '',
            filterColumnLabel: '',
            sortKey: 'submittedAt',
            sortOrder: 'desc',
            rows: this.submissions.map(s => ({ ...s, _checked: false })),
            editingRowId: null,
            editForm: {},
        };
    },
    watch: {
        submissions(newVal) {
            // Preserve checked state for rows that still exist
            const checkedIds = new Set(this.rows.filter(r => r._checked).map(r => r.id));
            this.rows = newVal.map(s => ({
                ...s,
                _checked: checkedIds.has(s.id)
            }));
        },
    },
    computed: {
        activeFilterLabel() {
            return this.filterColumn ? this.filterColumnLabel : 'Filter';
        },
        checkedCount() {
            return this.rows.filter(r => r._checked).length;
        },
        filteredRows() {
            let result = [...this.rows];
            // 1. Filtering
            if (this.search) {
                const q = this.search.toLowerCase();
                if (this.filterColumn) {
                    result = result.filter(r => String(r[this.filterColumn] || '').toLowerCase().includes(q));
                }
                else {
                    result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
                }
            }
            // 2. Sorting
            if (this.sortKey) {
                result.sort((a, b) => {
                    let valA = a[this.sortKey] || '';
                    let valB = b[this.sortKey] || '';
                    if (this.sortKey === 'submittedAt') {
                        valA = new Date(valA).getTime();
                        valB = new Date(valB).getTime();
                    }
                    else if (typeof valA === 'string') {
                        valA = valA.toLowerCase();
                        valB = String(valB).toLowerCase();
                    }
                    if (valA < valB)
                        return this.sortOrder === 'asc' ? -1 : 1;
                    if (valA > valB)
                        return this.sortOrder === 'asc' ? 1 : -1;
                    return 0;
                });
            }
            return result;
        },
        summary() {
            const rows = this.filteredRows;
            return {
                total: rows.length,
                present: rows.filter(r => r.status === 'present').length,
                late: rows.filter(r => r.status === 'late').length,
                pending: rows.filter(r => !r.status || r.status === 'pending' || r.status === '').length,
            };
        },
    },
    mounted() {
        this.loadSortSettings();
        document.addEventListener('click', this.onDocClick);
    },
    beforeUnmount() { document.removeEventListener('click', this.onDocClick); },
    methods: {
        toggleAll() { this.rows.forEach(r => { r._checked = this.allChecked; }); },
        toggleSort(key) {
            if (this.sortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            }
            else {
                this.sortKey = key;
                this.sortOrder = 'asc';
            }
            this.saveSortSettings();
        },
        saveSortSettings() {
            localStorage.setItem(`jf_sort_${this.formId}`, JSON.stringify({
                key: this.sortKey,
                order: this.sortOrder
            }));
        },
        loadSortSettings() {
            try {
                const saved = localStorage.getItem(`jf_sort_${this.formId}`);
                if (saved) {
                    const { key, order } = JSON.parse(saved);
                    this.sortKey = key;
                    this.sortOrder = order;
                }
            }
            catch (e) {
                console.warn('Failed to load sort settings');
            }
        },
        setFilter(key, label) {
            this.filterColumn = key;
            this.filterColumnLabel = label;
            this.showFilter = false;
        },
        deleteRow(id) {
            this.$emit('delete-submission', id);
        },
        startEdit(row) {
            this.editingRowId = row.id;
            this.editForm = { ...row };
        },
        async saveEdit(rowId) {
            try {
                // 1. Prepare data for backend
                // We need to transform flattened row back to formData structure if needed
                // but backend update endpoint expects { status, formData }
                const r = this.rows.find(row => row.id === rowId);
                if (!r)
                    return;
                // Construct updated formData structure
                const updatedFormData = {};
                this.columns.forEach(col => {
                    if (col.key !== 'status' && col.key !== 'checkInTime') {
                        updatedFormData[col.key] = {
                            label: col.label,
                            value: this.editForm[col.key]
                        };
                    }
                });
                const payload = {
                    formData: updatedFormData,
                    status: this.editForm.status
                };
                await updateResponse(rowId, payload);
                // 2. Update local state
                const idx = this.rows.findIndex(row => row.id === rowId);
                if (idx !== -1) {
                    this.rows[idx] = { ...this.rows[idx], ...this.editForm };
                    // Trigger reactivity
                    this.rows = [...this.rows];
                }
                this.editingRowId = null;
            }
            catch (err) {
                console.error('Failed to save edit:', err);
                alert('Failed to save changes.');
            }
        },
        cancelEdit() {
            this.editingRowId = null;
            this.editForm = {};
        },
        deleteSelected() {
            const checked = this.rows.filter(r => r._checked);
            checked.forEach(r => this.$emit('delete-submission', r.id));
            this.allChecked = false;
        },
        onDocClick(e) {
            if (this.$refs.filterWrap && !this.$refs.filterWrap.contains(e.target))
                this.showFilter = false;
            if (this.$refs.downloadWrap && !this.$refs.downloadWrap.contains(e.target))
                this.showDownload = false;
        },
        stripHtml(html) {
            if (!html)
                return '';
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return doc.body.textContent || "";
        },
        hasFile(val) {
          return this.getFiles(val).some(file => file.fileUrl || file.data);
        },
        getFiles(val) {
          if (!val)
            return [];
          if (typeof val === 'string' && !val.startsWith('{') && !val.startsWith('[')) {
            return [{ fileName: val, fileUrl: val }];
          }
          try {
            const parsed = typeof val === 'string' ? JSON.parse(val) : val;
            const files = Array.isArray(parsed) ? parsed : [parsed];
            return files.filter(file => file && typeof file === 'object');
          }
          catch {
            return [];
          }
        },
        getFileName(val) {
          return this.getFiles(val).map(file => file.fileName || file.name || 'Download').join(', ');
        },
        getFileData(val) {
            const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
            try {
            const obj = typeof val === 'string' ? JSON.parse(val) : val;
                const url = obj.fileUrl || obj.data;
                if (url && typeof url === 'string' && url.startsWith('/uploads'))
                    return `${baseUrl}${url}`;
            if (url && typeof url === 'string' && !url.startsWith('data:') && !url.startsWith('http'))
              return `${baseUrl}/uploads/${this.formId}/responses/${url}`;
                return url || '#';
            }
            catch {
                return '#';
            }
        },
        colIcon(type) {
            const m = {
                fullname: 'bi bi-person', email: 'bi bi-at', address: 'bi bi-geo-alt',
                phonenumber: 'bi bi-telephone', date: 'bi bi-calendar3', dropdown: 'bi bi-chevron-down',
                number: 'bi bi-hash', shorttext: 'bi bi-type', longtext: 'bi bi-justify',
                starrating: 'bi bi-star', scalerating: 'bi bi-sliders', singlechoice: 'bi bi-check-circle',
                multiplechoice: 'bi bi-check2-square', fileupload: 'bi bi-paperclip', tableinput: 'bi bi-table',
                paragraph: 'bi bi-text-paragraph', image: 'bi bi-image',
            };
            return m[type] || 'bi bi-dash';
        },
        async downloadPDF() {
            if (this.isExporting)
                return;
            this.isExporting = true;
            this.showDownload = false;
            // To ensure we capture the whole table (including off-screen columns), 
            // we temporarily force the table to its full width and a static position.
            const element = this.$refs.tableWrap;
            const originalStyle = element.getAttribute('style') || '';
            element.style.width = 'auto';
            element.style.overflow = 'visible';
            element.style.position = 'absolute';
            element.style.left = '-9999px';
            element.style.top = '0';
            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    width: element.scrollWidth,
                    height: element.scrollHeight
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                const fileName = `responses_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
                pdf.save(fileName);
            }
            catch (err) {
                console.error('PDF export failed:', err);
            }
            finally {
                element.setAttribute('style', originalStyle);
                this.isExporting = false;
            }
        },
        downloadExcel() {
            if (!this.filteredRows.length || this.isExporting)
                return;
            this.showDownload = false;
            const sheet = XLSX.utils.aoa_to_sheet(responseMatrix(this.columns, this.filteredRows));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, 'Responses');
            XLSX.writeFile(workbook, 'responses.xlsx');
        },
        downloadCSV() {
            if (!this.filteredRows.length || this.isExporting)
                return;
            this.showDownload = false;
            exportCSV(this.columns, this.filteredRows);
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-responses-ResponseTable.css"></style>

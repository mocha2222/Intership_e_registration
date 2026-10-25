<template>
  <div class="workspace-page d-flex flex-column">
    <SubHeader
      :active-folder-key="activeFolderKey"
      :active-item-label="activeItemLabel"
      :active-item-type="activeItemType"
      @search="onSearch"
      @filter-selected="onFilterSelected"
      @sort-selected="onSort"
      @toggle-sidebar="toggleMobileSidebar"
    />

    <div class="workspace-body d-flex flex-grow-1 overflow-hidden">
      <Sidebar
        :is-mobile-open="mobileSidebarOpen"
        @navigate="onNavigate"
        @open-add-label="onOpenAddLabel"
      />

      <div
        v-if="mobileSidebarOpen"
        class="workspace-backdrop d-lg-none"
        @click="mobileSidebarOpen = false"
      ></div>

      <div class="flex-grow-1 d-flex flex-column overflow-hidden position-relative">
        
        <div v-if="selectedFormIds.length > 0" class="bulk-action-bar d-flex align-items-center justify-content-between px-3">
          <div class="d-flex align-items-center gap-3">
            <div class="bulk-count d-flex align-items-center justify-content-center">{{ selectedFormIds.length }}</div>
            <span class="bulk-text d-none d-sm-inline">{{ $label('dashboard.formsSelected', { count: selectedFormIds.length }) }}</span>
            <button class="btn btn-link btn-sm text-white p-0 text-decoration-none fw-bold" @click="selectedFormIds = []">Deselect all</button>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button v-if="activeItemType !== 'archive'" class="btn bulk-btn" @click="bulkArchive">
              <i class="bi bi-archive me-1"></i><span class="d-none d-md-inline">Archive</span>
            </button>
            <button v-if="activeItemType !== 'trash'" class="btn bulk-btn bulk-btn-danger" @click="bulkTrash">
              <i class="bi bi-trash me-1"></i><span class="d-none d-md-inline">Move to Trash</span>
            </button>
            <button v-if="activeItemType === 'trash'" class="btn bulk-btn bulk-btn-success" @click="bulkRestore">
              <i class="bi bi-arrow-counterclockwise me-1"></i><span class="d-none d-md-inline">Restore</span>
            </button>
            <button v-if="activeItemType === 'trash'" class="btn bulk-btn bulk-btn-danger" @click="bulkPermanentDelete">
              <i class="bi bi-x-circle me-1"></i><span class="d-none d-md-inline">Delete Forever</span>
            </button>
          </div>
        </div>

        <div v-if="filteredForms.length > 0" class="form-list overflow-auto">
          <FormBar
            v-for="form in filteredForms"
            :key="form.id"
            :form="form"
            :viewMode="currentViewMode"
            :checked="selectedFormIds.includes(form.id)"
            @toggle-select="onToggleSelect"
            @edit="onEdit"
            @view="onView"
            @delete-form="onDeleteForm"
            @archive-form="onArchiveForm"
            @toggle-favorite="onToggleFavorite"
            @restore-form="onRestoreForm"
            @permanent-delete="onPermanentDelete"
            @move-to-folder="onMoveToFolder"
          />
        </div>

        <div v-else class="jf-empty-state d-flex flex-column align-items-center justify-content-center flex-grow-1">
          <img
            v-if="activeItemType === 'all' || activeItemType === 'folder' || activeItemType === 'team'"
            src="@/assets/emptyElement.png"
            alt="No forms"
            class="jf-empty-img mb-3"
          />
          <div v-else class="jf-empty-icon mb-3">
            <i :class="emptyIcon"></i>
          </div>
          <h3 class="jf-empty-title mb-2">{{ emptyTitle }}</h3>
          <p class="jf-empty-sub mb-4">{{ emptySubtitle }}</p>
          <div v-if="activeItemType === 'all' || activeItemType === 'folder' || activeItemType === 'team'" @click="handleCreateForm" class="btn jf-empty-btn" style="cursor: pointer;">+ CREATE FORM</div>
          <div v-if="activeItemType === 'trash'" class="jf-trash-note">
            <i class="bi bi-exclamation-circle-fill me-1"></i> Items in trash will be permanently deleted after 30 days
          </div>
        </div>
      </div>
    </div>

    <AddLabelModal
      :open="showAddLabelModal"
      @close="showAddLabelModal = false"
      @save="onAddLabel"
    />
  </div>
</template>

<script>
import Sidebar from '@/components/workspace/WorkspaceSidebar.vue';
import SubHeader from '@/components/workspace/WorkspaceToolbar.vue';
import FormBar from '@/components/workspace/FormCard.vue';
import AddLabelModal from '@/components/workspace/AddLabelModal.vue';
import { parseApiDatetime, parseDateTime } from '@/utils/dates';
import { store } from '@/store/store';
import { getActiveForms, getFavoriteForms, getArchivedForms, getTrashedForms, toggleFavorite, moveToTrash, archiveForm, unarchiveForm, restoreFromTrash, permanentDelete, isFavorite, saveForm, getForm, createForm, fetchFormsFromApi } from '@/store/formStore';
import { getSubmissions } from '@/store/submissionStore';
import { fetchFoldersFromApi, createFolder } from '@/store/folderStore';
export default {
    name: 'WorkspacePage',
    components: { Sidebar, SubHeader, FormBar, AddLabelModal },
    data() {
        return {
            searchQuery: '',
            statusFilter: 'all',
            activeFolderKey: null,
            activeItemLabel: 'All',
            activeItemType: 'all',
            sortValue: 'last-activity',
            mobileSidebarOpen: false,
            showAddLabelModal: false,
            addTargetParentKey: null,
            selectedFormIds: [],
        };
    },
    computed: {
        currentViewMode() {
            if (this.activeItemType === 'archive')
                return 'archive';
            if (this.activeItemType === 'trash')
                return 'trash';
            if (this.activeItemType === 'favorites')
                return 'favorites';
            return 'normal';
        },
        baseForms() {
            let forms;
            if (this.activeItemType === 'favorites')
                forms = getFavoriteForms();
            else if (this.activeItemType === 'archive')
                forms = getArchivedForms();
            else if (this.activeItemType === 'trash')
                forms = getTrashedForms();
            else
                forms = getActiveForms();
            return forms.map(f => {
                const subs = getSubmissions(f.id);
                const subCount = subs.length;
                const submissionLabel = subCount === 1 ? 'dashboard.submission' : 'dashboard.submissions';
                const subText = this.$label(submissionLabel, { count: subCount });
                // Format date using current locale
                const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                const formattedDate = new Date(f.created_at).toLocaleDateString('en-US', dateOptions);
                const createdText = this.$label('dashboard.createdOn', { date: formattedDate });
                // Pre-calculate timestamps for sorting
                const parseDate = (d) => (d ? new Date(d).getTime() : 0);
                const lastResponseMs = subs.length > 0 ? Math.max(...subs.map(s => parseDate(s.submittedAt))) : 0;
                const folder = store.folders.find(folder => Number(folder.id) === Number(f.folderId));
                return {
                    id: f.id,
                    title: f.title,
                    label: folder?.name || '',
                    folderId: f.folderId || null,
                    status: f.status || 'enabled',
                    logoUrl: f.logoUrl || '',
                    isFavorite: isFavorite(f.id),
                    submissionStartTime: f.settings?.submissionStartTime || null,
                    submissionEndTime: f.settings?.submissionEndTime || null,
                    expirationDate: f.expirationDate || null,
                    expirationTime: f.expirationTime || null,
                    submissionLimit: f.settings?.submissionLimit ?? null,
                    submissionCount: subCount,
                    updatedAtMs: parseDate(f.updated_at),
                    createdAtMs: parseDate(f.created_at),
                    lastResponseMs: lastResponseMs,
                    meta: `${subText}. ${createdText}`,
                };
            });
        },
        currentFolderForms() {
            if (['favorites', 'archive', 'trash'].includes(this.activeItemType))
                return this.baseForms;
            if (this.activeFolderKey === null || this.activeFolderKey === 'all')
                return this.baseForms;
            const activeFolderNum = Number(this.activeFolderKey);
            return this.baseForms.filter(f => f.folderId != null && Number(f.folderId) === activeFolderNum);
        },
        filteredForms() {
            let forms = this.currentFolderForms;
            if (this.statusFilter && this.statusFilter !== 'all') {
                forms = forms.filter(f => this.statusFilter === 'enabled' ? this.isFormActive(f) : this.isFormClosed(f));
            }
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                forms = forms.filter(f => f.title.toLowerCase().includes(q));
            }
            // ── Sorting ──
            const sorted = [...forms];
            sorted.sort((a, b) => {
                switch (this.sortValue) {
                    case 'title-asc':
                        return a.title.localeCompare(b.title);
                    case 'title-desc':
                        return b.title.localeCompare(a.title);
                    case 'creation-date':
                        return b.createdAtMs - a.createdAtMs;
                    case 'last-activity':
                    case 'last-edit':
                        return b.updatedAtMs - a.updatedAtMs;
                    case 'last-response':
                        return b.lastResponseMs - a.lastResponseMs;
                    default:
                        return 0;
                }
            });
            return sorted;
        },
        emptyTitle() {
            const m = {
                favorites: 'No favorite forms yet',
                archive: 'No archived forms',
                trash: 'Trash is empty'
            };
            return m[this.activeItemType] || 'You don\'t have anything here yet.';
        },
        emptySubtitle() {
            const m = {
                favorites: 'Star a form to add it to favorites.',
                archive: 'Archived forms will appear here.',
                trash: 'Deleted forms stay here for 30 days.'
            };
            return m[this.activeItemType] || 'Create your first form to start collecting data.';
        },
        emptyIcon() {
            const m = { favorites: 'bi bi-star-fill', archive: 'bi bi-archive', trash: 'bi bi-trash-fill' };
            return m[this.activeItemType] || 'bi bi-collection';
        },
    },
    watch: {
        activeFolderKey() { this.selectedFormIds = []; },
        activeItemType() { this.selectedFormIds = []; },
    },
    async mounted() {
        if (store.currentUser && store.forms.length === 0) {
            await fetchFormsFromApi('all');
            await fetchFoldersFromApi();
        }
    },
    methods: {
        // Navigate between workspace items (e.g. All, folders, archives)
        onNavigate(payload) {
            const info = typeof payload === 'string'
                ? { key: payload, label: payload, type: payload === 'all' ? 'all' : 'feature' }
                : payload;
            this.activeFolderKey = info.key;
            this.activeItemLabel = info.label || 'All';
            this.activeItemType = info.type || 'feature';
            if (window.innerWidth <= 991) {
                this.mobileSidebarOpen = false;
            }
        },
        // Check if the form is currently open/active
        isFormActive(form) {
            return !this.isFormClosed(form);
        },
        // Check if the form is closed due to deadlines, limits, or manual disable status
        isFormClosed(form) {
            const now = new Date();
            const status = form.status || 'enabled';
            if (status === 'disabled')
                return true;
            // Verify submission start time
            const submissionStart = parseApiDatetime(form.settings?.submissionStartTime || form.submissionStartTime);
            if (submissionStart && !Number.isNaN(submissionStart.getTime()) && now < submissionStart) {
                return true;
            }
            // Verify submission end time
            const submissionEnd = parseApiDatetime(form.settings?.submissionEndTime || form.submissionEndTime);
            if (submissionEnd && !Number.isNaN(submissionEnd.getTime()) && now > submissionEnd) {
                return true;
            }
            // Verify expiration date status
            if (['disable_date', 'disable_both'].includes(status)) {
                const expirationDate = parseDateTime(form.expirationDate, form.expirationTime);
                if (expirationDate && now > expirationDate)
                    return true;
            }
            // Verify submission limit status
            if (['disable_limit', 'disable_both'].includes(status)) {
                const submissionLimit = Number(form.settings?.submissionLimit || form.submissionLimit);
                const submissionCount = Number(form.submissionCount || 0);
                if (Number.isFinite(submissionLimit) && submissionLimit > 0 && submissionCount >= submissionLimit) {
                    return true;
                }
            }
            return false;
        },
        // Show modal to add a new folder label
        onOpenAddLabel(parentKey) {
            this.addTargetParentKey = parentKey;
            this.showAddLabelModal = true;
        },
        // Create a new folder label
        async onAddLabel(name) {
            const folder = await createFolder(name, '#4eaee7', this.addTargetParentKey ? Number(this.addTargetParentKey) : undefined);
            this.showAddLabelModal = false;
            if (folder) {
                this.activeFolderKey = folder.id;
                this.activeItemLabel = folder.name;
                this.activeItemType = 'folder';
            }
            this.addTargetParentKey = null;
        },
        // Search query updater
        onSearch(value) {
            this.searchQuery = value;
        },
        // Status filter updater
        onFilterSelected(value) {
            this.statusFilter = value;
        },
        // Sort order updater
        onSort(v) {
            this.sortValue = v;
        },
        // Mobile menu toggle
        toggleMobileSidebar() {
            this.mobileSidebarOpen = !this.mobileSidebarOpen;
        },
        // Open form builder editor
        onEdit(form) {
            this.$router.push({ name: 'formEditor', params: { id: form.id } });
        },
        // Open form responses view
        onView(form) {
            this.$router.push({ name: 'formResponses', params: { id: form.id } });
        },
        // Move form to trash folder
        onDeleteForm(form) {
            moveToTrash(form.id);
        },
        // Move form to archive folder
        onArchiveForm(form) {
            archiveForm(form.id);
        },
        // Toggle form star/favorite status
        onToggleFavorite(form) {
            toggleFavorite(form.id);
        },
        // Restore form from archive or trash
        onRestoreForm(form) {
            if (this.activeItemType === 'archive') {
                unarchiveForm(form.id);
            }
            else if (this.activeItemType === 'trash') {
                restoreFromTrash(form.id);
            }
        },
        // Permanently delete form
        async onPermanentDelete(form) {
            try { await permanentDelete(form.id); }
            catch (error) { alert(error.message || 'Could not delete this form.'); }
        },
        // Toggle multi-select checkbox status
        onToggleSelect(formId) {
            const idx = this.selectedFormIds.indexOf(formId);
            if (idx > -1) {
                this.selectedFormIds.splice(idx, 1);
            }
            else {
                this.selectedFormIds.push(formId);
            }
        },
        // Perform bulk archive on selected items
        bulkArchive() {
            this.selectedFormIds.forEach(id => archiveForm(id));
            this.selectedFormIds = [];
        },
        // Perform bulk trash on selected items
        bulkTrash() {
            this.selectedFormIds.forEach(id => moveToTrash(id));
            this.selectedFormIds = [];
        },
        // Perform bulk restore on selected items
        bulkRestore() {
            if (this.activeItemType === 'archive') {
                this.selectedFormIds.forEach(id => unarchiveForm(id));
            }
            else if (this.activeItemType === 'trash') {
                this.selectedFormIds.forEach(id => restoreFromTrash(id));
            }
            this.selectedFormIds = [];
        },
        // Perform bulk permanent delete on selected items
        async bulkPermanentDelete() {
            const failed = [];
            for (const id of this.selectedFormIds) {
                try { await permanentDelete(id); }
                catch { failed.push(id); }
            }
            this.selectedFormIds = failed;
            if (failed.length) alert('Some forms could not be deleted. They remain selected.');
        },
        // Move a form to a folder or all forms root
        onMoveToFolder({ form, folderId }) {
            const storeForm = getForm(form.id);
            if (!storeForm)
                return;
            if (folderId === 'all' || folderId === null) {
                storeForm.folderId = null;
                storeForm.label = '';
            }
            else {
                storeForm.folderId = Number(folderId);
                const folder = store.folders.find(f => f.id === String(folderId));
                if (folder)
                    storeForm.label = folder.name;
            }
            saveForm(storeForm).catch(error => alert(error.message || 'Could not save the folder change.'));
        },
        // Create a new form from workspace action button
        async handleCreateForm() {
            const layoutType = 'classic';
            const folderIdVal = (this.activeFolderKey && this.activeFolderKey !== 'all') ? Number(this.activeFolderKey) : null;
            const folderName = this.activeItemLabel || 'All Forms';
            sessionStorage.setItem('formLayoutType', layoutType);
            sessionStorage.setItem('folderName', folderName);
            const tempId = `form-${Date.now()}`;
            try {
                const officialForm = await createForm(tempId, 'Form', layoutType, folderIdVal);
                this.$router.push({ name: 'formEditor', params: { id: officialForm.id } });
            }
            catch (error) {
                console.error('Failed to create form from workspace empty state:', error);
                alert('Failed to create form. Please check your internet connection.');
            }
        },
    },
};
</script>

<style scoped src="@/assets/styles/views-WorkspacePage.css"></style>

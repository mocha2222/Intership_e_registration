<template>
  <div class="jf-subheader d-flex align-items-stretch">
    <div @click="handleCreateForm" class="jf-create-link text-decoration-none d-none d-lg-flex" style="cursor: pointer;">
      <div class="jf-create-slot d-flex align-items-center px-3">
        <span class="btn jf-create-btn w-100 d-inline-flex align-items-center justify-content-center">+ CREATE FORM</span>
      </div>
    </div>

    <div class="jf-toolbar d-flex align-items-center justify-content-between px-3 flex-grow-1">
      
      <div class="d-none d-lg-flex align-items-center gap-2">
        <template v-if="activeItemType === 'folder'">
          <button class="btn jf-bc-btn d-flex align-items-center" type="button">
            <i class="bi bi-grid-3x3-gap-fill me-2"></i><span>All</span>
          </button>
          <i class="bi bi-chevron-right jf-chevron"></i>
          <button class="btn jf-bc-btn d-flex align-items-center" type="button">
            <i class="bi bi-folder-fill me-2 text-primary"></i>
            <span>{{ activeItemLabel || 'Folder' }}</span>
          </button>
        </template>
        <template v-else>
          <button class="btn jf-bc-btn d-flex align-items-center" type="button">
            <i class="bi bi-grid-3x3-gap-fill me-2"></i>
            <span>{{ activeItemLabel || 'All' }}</span>
          </button>
        </template>
      </div>

      <div class="jf-tools d-flex align-items-center gap-2">
        
        <button class="jf-mobile-menu-trigger d-lg-none d-flex align-items-center" type="button" @click.stop.prevent="$emit('toggle-sidebar')">
          <i class="bi bi-list me-1"></i><span>Menu</span>
        </button>

        <div @click="handleCreateForm" class="btn jf-tool-btn d-lg-none d-flex align-items-center jf-mobile-create" style="cursor: pointer;">
          <i class="bi bi-plus-lg me-1"></i><span>Create</span>
        </div>

        <div ref="filterMenu" class="position-relative">
          <button class="btn jf-tool-btn jf-filter-btn d-flex align-items-center" type="button" @click="toggleFilterMenu">
            <i class="bi bi-funnel me-1"></i>
            <span>{{ filterLabel }}</span>
            <i class="bi ms-1" :class="filterOpen ? 'bi-chevron-up' : 'bi-chevron-down'" style="font-size:10px;"></i>
          </button>
          <WorkspaceDropdown
            v-if="filterOpen"
            :model-value="filterValue"
            :options="filterOptions"
            aria-label="Filter forms"
            :show-check="false"
            @select="selectFilter"
          />
        </div>

        <div ref="sortMenu" class="position-relative">
          <button class="btn jf-tool-btn jf-sort-btn d-flex align-items-center" type="button" @click="toggleSortMenu">
            <i class="bi bi-sort-down me-1"></i>
            <span>{{ sortLabel }}</span>
            <i class="bi ms-1" :class="sortOpen ? 'bi-chevron-up' : 'bi-chevron-down'" style="font-size:10px;"></i>
          </button>
          <WorkspaceDropdown
            v-if="sortOpen"
            :model-value="sortValue"
            :options="sortOptions"
            aria-label="Sort forms"
            @update:modelValue="sortValue = $event"
            @select="onSortSelect"
          />
        </div>

        <div class="jf-search d-flex align-items-center" :class="{ 'jf-search--expanded': mobileSearchOpen }">
          <i class="bi bi-search" @click="mobileSearchOpen = !mobileSearchOpen"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search forms..."
            class="form-control jf-search-input border-0"
            :class="{ 'd-none d-lg-block': !mobileSearchOpen }"
            maxlength="80"
          />
          <button v-if="mobileSearchOpen" class="jf-search-close d-lg-none" @click="mobileSearchOpen = false; searchQuery = ''">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WorkspaceDropdown from '@/components/workspace/WorkspaceDropdown.vue';
import { sanitizeText } from '@/utils/validators';
import { createForm } from '@/store/formStore';
export default {
    name: 'SubHeader',
    components: { WorkspaceDropdown },
    props: {
        activeFolderKey: { type: String, default: 'all' },
        activeItemLabel: { type: String, default: 'All' },
        activeItemType: { type: String, default: 'all' },
    },
    data() {
        return {
            searchQuery: '',
            sortOpen: false,
            sortValue: 'last-activity',
            filterOpen: false,
            filterValue: 'all',
            mobileSearchOpen: false,
            filterOptions: [
                { value: 'all', labelKey: 'dashboard.allForms', icon: 'bi bi-grid-3x3-gap' },
                { value: 'enabled', labelKey: 'status.enabled', icon: 'bi bi-check-circle' },
                { value: 'disabled', labelKey: 'status.disabled', icon: 'bi bi-slash-circle' },
            ],
            sortOptions: [
              { value: 'last-activity', labelKey: 'dashboard.lastActivity' },
              { value: 'last-response', labelKey: 'dashboard.lastResponse' },
              { value: 'last-edit', labelKey: 'dashboard.lastEdit' },
              { value: 'creation-date', labelKey: 'dashboard.creationDate' },
              { value: 'title-asc', labelKey: 'dashboard.titleAsc' },
              { value: 'title-desc', labelKey: 'dashboard.titleDesc' },
            ],
        };
    },
    watch: {
        searchQuery(value) {
            const clean = sanitizeText(value, 80);
            if (clean !== value) {
                this.searchQuery = clean;
                return;
            }
            this.$emit('search', clean);
        },
    },
    computed: {
        sortLabel() {
        const option = this.sortOptions.find(item => item.value === this.sortValue);
        return option ? this.$label(option.labelKey) : 'Last Activity';
        },
        filterLabel() {
            const opt = this.filterOptions.find(o => o.value === this.filterValue);
            return opt ? this.$label(opt.labelKey) : 'All Forms';
        },
    },
    mounted() { document.addEventListener('click', this.onDocClick); },
    beforeUnmount() { document.removeEventListener('click', this.onDocClick); },
    methods: {
        toggleSortMenu() { this.sortOpen = !this.sortOpen; this.filterOpen = false; },
        toggleFilterMenu() { this.filterOpen = !this.filterOpen; this.sortOpen = false; },
        closeFilterMenu() { setTimeout(() => { this.filterOpen = false; }, 200); },
        closeSortMenu() { setTimeout(() => { this.sortOpen = false; }, 200); },
        onSortSelect(v) { this.sortValue = v; this.closeSortMenu(); this.$emit('sort-selected', v); },
        selectFilter(v) {
            this.filterValue = v;
            this.closeFilterMenu();
            this.$emit('filter-selected', v);
        },
        onDocClick(e) {
            if (this.$refs.sortMenu && !this.$refs.sortMenu.contains(e.target))
                this.closeSortMenu();
            if (this.$refs.filterMenu && !this.$refs.filterMenu.contains(e.target))
                this.closeFilterMenu();
        },
        async handleCreateForm() {
            const layoutType = 'classic';
            const folderIdVal = (this.activeFolderKey && this.activeFolderKey !== 'all') ? Number(this.activeFolderKey) : null;
            const folderName = this.activeItemLabel || 'All Forms';
            // Store context for form editor
            sessionStorage.setItem('formLayoutType', layoutType);
            sessionStorage.setItem('folderName', folderName);
            const tempId = `form-${Date.now()}`;
            try {
                const officialForm = await createForm(tempId, 'Form', layoutType, folderIdVal);
                this.$router.push({ name: 'formEditor', params: { id: officialForm.id } });
            }
            catch (error) {
                console.error('Failed to create form:', error);
                alert('Failed to create form. Please check your internet connection.');
            }
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-workspace-WorkspaceToolbar.css"></style>
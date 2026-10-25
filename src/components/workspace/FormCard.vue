<template>
  <div
    class="jf-form-row d-flex align-items-center px-3"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="goToResponses"
  >
    <input
      :checked="checked"
      class="jf-check-input me-3"
      type="checkbox"
      @click.stop="$emit('toggle-select', form.id)"
    />    
    
    <button class="btn p-0 me-3 d-none d-sm-inline-flex" style="width: 20px;" type="button" @click.stop="$emit('toggle-favorite', form)">
      <i class="bi" :class="form.isFavorite ? 'bi-star-fill text-warning' : 'bi-star text-secondary'"></i>
    </button>

    <div class="jf-form-icon me-3" :class="{ 'has-logo': firstLogoUrl }">
      <img v-if="firstLogoUrl" :src="$resolveImg(firstLogoUrl)" class="jf-form-logo" alt="logo" />
      <i v-else class="bi bi-card-text"></i>
    </div>

    <div class="flex-grow-1 min-width-0">
      <div class="d-flex align-items-center gap-2">
        <div class="jf-title text-truncate">{{ form.title }}</div>
        <span v-if="form.label && !['trash', 'archive'].includes(form.label.toLowerCase())" class="jf-badge">{{ form.label }}</span>
        <span v-if="viewMode === 'archive'" class="jf-badge-muted"><i class="bi bi-archive me-1"></i>Archive</span>
        <span v-if="viewMode === 'trash'" class="jf-badge-danger"><i class="bi bi-trash me-1"></i>Trash</span>
      </div>
      <div class="jf-meta text-truncate">{{ form.meta }}</div>
    </div>

    <div v-if="viewMode === 'normal' || viewMode === 'favorites'" class="d-flex align-items-center gap-2 jf-actions" :class="{ visible: isHover }">
      <a href="#" class="jf-action-link jf-btn-wide d-none d-md-flex" @click.stop.prevent="goToEditor">
        <i class="bi bi-pencil-fill me-2"></i>
        <span>Edit</span>
      </a>
      <a href="#" class="jf-action-link jf-btn-wide d-none d-md-flex" @click.stop.prevent="goToResponses">
        <i class="bi bi-inbox-fill me-2"></i>
        <span>Inbox</span>
      </a>
      <div class="position-relative" @click.stop>
        <a href="#" class="jf-action-link" @click.prevent="showDropdown = !showDropdown">
          <i class="bi bi-three-dots-vertical"></i>
        </a>
        <div v-if="showDropdown" class="jf-dropdown">
          <a href="#" class="jf-dd-item d-sm-none" @click.prevent="goToEditor"><i class="bi bi-pencil me-2"></i>Edit</a>
          <a href="#" class="jf-dd-item d-sm-none" @click.prevent="goToResponses"><i class="bi bi-inbox me-2"></i>Inbox</a>
          <a href="#" class="jf-dd-item" @click.prevent="goToSettings"><i class="bi bi-gear me-2"></i>Settings</a>
          <a href="#" class="jf-dd-item" @click.prevent="goToPublicPage"><i class="bi bi-globe me-2"></i>Open Form</a>
          <a href="#" class="jf-dd-item d-sm-none" @click.prevent="$emit('toggle-favorite', form); showDropdown=false">
            <i class="bi" :class="form.isFavorite ? 'bi-star-fill text-warning me-2' : 'bi-star me-2'"></i>
            <span>{{ form.isFavorite ? 'Unfavorite' : 'Favorite' }}</span>
          </a>
          <div class="jf-dd-submenu-parent" :class="{ 'submenu-open': showSubmenu }" @click.stop="toggleSubmenu">
            <a href="#" class="jf-dd-item"><i class="bi bi-folder-symlink me-2"></i>Move to Folder <i class="bi bi-chevron-right float-end mt-1" :class="{ 'bi-chevron-down': showSubmenu }"></i></a>
            <div v-if="showSubmenu" class="jf-dd-submenu d-block">
              <a href="#" class="jf-dd-item" @click.prevent="moveToFolder('all')">All Forms</a>
              <a v-for="folder in store.folders" :key="folder.id" href="#" class="jf-dd-item" @click.prevent="moveToFolder(folder.id)">
                {{ folder.name }}
              </a>
            </div>
          </div>
          <a href="#" class="jf-dd-item" @click.prevent="$emit('archive-form', form); showDropdown=false"><i class="bi bi-archive me-2"></i>Archive</a>
          <hr class="my-1" />
          <a href="#" class="jf-dd-item text-danger" @click.prevent="$emit('delete-form', form); showDropdown=false"><i class="bi bi-trash me-2"></i>Delete</a>
        </div>
      </div>
    </div>

    <div v-if="viewMode === 'archive' || viewMode === 'trash'" class="d-flex align-items-center gap-1 jf-actions visible">
      <a href="#" class="jf-action-link jf-restore-link" @click.stop.prevent="$emit('restore-form', form)" title="Restore">
        <i class="bi bi-arrow-counterclockwise"></i>
        <span class="ms-1 d-none d-sm-inline">Restore</span>
      </a>
      <a v-if="viewMode === 'archive'" href="#" class="jf-action-link jf-btn-wide text-danger" @click.stop.prevent="$emit('delete-form', form)" title="Delete">
        <i class="bi bi-trash-fill"></i>
        <span class="ms-2 d-none d-sm-inline">Delete</span>
      </a>
      <a v-else href="#" class="jf-action-link jf-btn-wide text-danger" @click.stop.prevent="$emit('permanent-delete', form)" title="Delete Forever">
        <i class="bi bi-trash-fill"></i>
        <span class="ms-2 d-none d-sm-inline">Delete Forever</span>
      </a>
    </div>
  </div>
</template>

<script>
import { store } from '@/store/store';
export default {
    name: 'FormBar',
    props: {
        form: { type: Object, required: true },
        viewMode: { type: String, default: 'normal' }, // 'normal', 'favorites', 'archive', 'trash'
        checked: { type: Boolean, default: false },
    },
    emits: [
      'toggle-favorite', 
      'archive-form', 
      'delete-form', 
      'restore-form', 
      'permanent-delete', 
      'edit', 
      'view', 
      'move-to-folder', 
      'toggle-select'
    ],
    data() { 
      return { 
        isHover: false, 
        showDropdown: false, 
        showSubmenu: false, 
        store 
      }; },
    computed: {
        firstLogoUrl() {
            const value = this.form?.logoUrl;
            if (!value || value === 'null')
                return '';
            if (Array.isArray(value))
                return value.find(Boolean) || '';
            if (typeof value !== 'string')
                return '';
            const trimmed = value.trim();
            if (!trimmed)
                return '';
            if (trimmed.startsWith('[')) {
                try {
                    const logos = JSON.parse(trimmed);
                    if (Array.isArray(logos))
                        return logos.find(Boolean) || '';
                }
                catch (e) {
                    // Fall back to the legacy single-logo value.
                }
            }
            return value;
        },
    },
    mounted() { 
      document.addEventListener('click', this.onDocClick); 
    },
    beforeUnmount() { 
      document.removeEventListener('click', this.onDocClick); 
    },
    methods: {
        onMouseEnter() {
            if (window.innerWidth > 991)
                this.isHover = true;
        },
        onMouseLeave() {
            if (!this.showDropdown)
                this.isHover = false;
        },
        onDocClick(e) {
            if (this.showDropdown && this.$el && !this.$el.contains(e.target)) {
                this.showDropdown = false;
                this.isHover = false;
                this.showSubmenu = false;
            }
        },
        toggleSubmenu() {
            this.showSubmenu = !this.showSubmenu;
        },
        goToResponses() {
            if (this.viewMode === 'trash')
                return; // don't navigate from trash
            this.$router.push({ name: 'formResponses', params: { id: this.form.id } });
        },
        goToEditor() { this.$router.push({ name: 'formEditor', params: { id: this.form.id } }); },
        goToSettings() { this.showDropdown = false; this.$router.push({ name: 'formSettings', params: { id: this.form.id } }); },
        goToPublicPage() { this.showDropdown = false; window.open(this.$router.resolve({ name: 'formFill', params: { id: this.form.shareToken } }).href, '_blank', 'noopener'); },
        moveToFolder(folderId) {
            this.showDropdown = false;
            this.$emit('move-to-folder', { form: this.form, folderId });
        }
    },
};
</script>

<style scoped src="@/assets/styles/components-workspace-FormCard.css"></style>

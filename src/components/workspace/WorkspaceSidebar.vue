<template>
  <aside
    ref="sidebarRoot"
    class="jf-sidebar d-flex flex-column position-relative"
    :class="{ 'is-mobile-open': isMobileOpen }"
  >
    <div class="jf-scroll pe-1">
      <div class="jf-section">
        <div class="d-flex justify-content-between align-items-center jf-section-title jf-section-header">
          <span>My Workspace</span>
        </div>

        <a href="#" class="jf-link" :class="{ active: activeKey === 'all' }" @click.prevent="toggleAllSection">
          <i class="bi me-1 jf-caret" :class="isAllOpen ? 'bi-caret-down-fill' : 'bi-caret-right-fill'"></i>
          <i class="bi bi-grid-3x3-gap-fill me-2"></i>
          <span>All</span>
        </a>

        <template v-if="isAllOpen">
          <div
            v-for="label in displayedLabels"
            :key="label.key"
            class="jf-folder-row d-flex align-items-center"
            :class="{ active: activeKey === label.key }"
          >
            <a
              href="#"
              class="jf-link jf-sub-link flex-grow-1"
              @click.prevent="setActive(label.key, label.name, 'folder')"
              :style="{ paddingLeft: `${28 + (label.depth * 20)}px` }"
            >
              <i
                v-if="hasChildren(label.key)"
                class="bi me-1 jf-caret"
                :class="label.isOpen ? 'bi-caret-down-fill' : 'bi-caret-right-fill'"
                @click.stop.prevent="toggleFolder(label.key)"
              ></i>
              <span v-else class="jf-arrow-placeholder me-1"></span>
              <i class="bi bi-folder-fill me-2" :style="{ color: label.color }"></i>
              <span>{{ label.name }}</span>
            </a>

            <button class="jf-dots-btn" type="button" @click.stop="openCustomizeMenu($event, label)">
              <i class="bi bi-three-dots-vertical"></i>
            </button>
          </div>
        </template>

        <a href="#" class="jf-link text-muted" @click.prevent="openAddLabel">
          <i class="bi bi-plus-circle-fill me-2"></i>
          <span>Add Label</span>
        </a>
      </div>

      <hr class="jf-divider" />

      <hr class="jf-divider" />

      <a
        v-for="item in bottomLinks"
        :key="item.key"
        href="#"
        class="jf-link"
        :class="{ active: activeKey === item.key }"
        @click.prevent="setActive(item.key, item.label, item.key)"
      >
        <i :class="item.icon + ' me-2'"></i>
        <span>{{ $label(item.labelKey) || item.label }}</span>
      </a>
    </div>

    <div v-if="showCustomizeMenu" class="jf-menu-backdrop" @click="closeCustomizeMenu"></div>

    <CustomizeFolder
      :open="showCustomizeMenu"
      :top="menuTop"
      :left="menuLeft"
      @change-color="changeActiveFolderColor"
      @delete-folder="deleteActiveFolder"
      @add-sublabel="openAddSubLabel"
      @add-asset="closeCustomizeMenu"
      @change-name="closeCustomizeMenu"
    />

    </aside>
</template>

<script>
import { store } from '@/store/store';
import { updateFolder, deleteFolder } from '@/store/folderStore';
import CustomizeFolder from '@/components/workspace/FolderModal.vue';
export default {
    name: 'Sidebar',
    components: { CustomizeFolder },
    props: {
        isMobileOpen: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            activeKey: 'all',
            isAllOpen: true,
            showCustomizeMenu: false,
            menuTop: 0,
            menuLeft: 0,
            customizeFolderKey: null,
            bottomLinks: [
                { key: 'favorites', label: 'Favorites', labelKey: 'dashboard.favorites', icon: 'bi bi-star-fill' },
                { key: 'archive', label: 'Archive', labelKey: 'dashboard.archive', icon: 'bi bi-archive-fill' },
                { key: 'trash', label: 'Trash', labelKey: 'dashboard.trash', icon: 'bi bi-trash-fill' },
            ],
        };
    },
    computed: {
        displayedLabels() {
            const output = [];
            const walk = (parentKey, depth) => {
                const children = store.folders.filter((item) => item.parentId === parentKey);
                children.forEach((item) => {
                    output.push({ ...item, depth, key: item.id });
                    if (item.isOpen) {
                        walk(item.id, depth + 1);
                    }
                });
            };
            walk(null, 0);
            return output;
        },
    },
    methods: {
        toggleAllSection() {
            this.activeKey = 'all';
            this.isAllOpen = !this.isAllOpen;
            this.$emit('navigate', { key: 'all', label: 'All', type: 'all' });
        },
        setActive(key, label = '', type = 'feature') {
            this.activeKey = key;
            this.$emit('navigate', { key, label, type });
        },
        hasChildren(key) {
            return store.folders.some((item) => item.parentId === key);
        },
        toggleFolder(key) {
            const target = store.folders.find((item) => item.id === key);
            if (!target)
                return;
            target.isOpen = !target.isOpen;
        },
        openCustomizeMenu(event, label) {
            const rowRect = event.currentTarget.getBoundingClientRect();
            const hostRect = this.$refs.sidebarRoot.getBoundingClientRect();
            this.customizeFolderKey = label.id;
            this.menuTop = rowRect.top - hostRect.top + 30;
            this.menuLeft = rowRect.left - hostRect.left + 20;
            this.showCustomizeMenu = true;
        },
        closeCustomizeMenu() {
            this.showCustomizeMenu = false;
            this.customizeFolderKey = null;
        },
        async changeActiveFolderColor(color) {
          if (!store.folders.some((item) => item.id === this.customizeFolderKey))
                return;
            await updateFolder(Number(this.customizeFolderKey), { color });
            this.closeCustomizeMenu();
        },
        async deleteActiveFolder() {
            if (!this.customizeFolderKey)
                return;
            const keyToDelete = String(this.customizeFolderKey);
            // Ensure that the folder doesn't have forms or subfolders
            const folderIdNum = Number(keyToDelete);
            const hasForms = store.forms.some(f => f.folderId === folderIdNum);
            const hasSubfolders = store.folders.some(f => String(f.parentId) === keyToDelete);
            if (hasForms || hasSubfolders) {
              alert('Cannot delete folder: There are forms or subfolders inside this folder.');
                this.closeCustomizeMenu();
                return;
            }
            await deleteFolder(Number(keyToDelete));
            if (this.activeKey === keyToDelete) {
                this.setActive('all', 'All', 'all');
            }
            this.closeCustomizeMenu();
        },
        openAddLabel() {
            this.closeCustomizeMenu();
            this.$emit('open-add-label', null);
        },
        openAddSubLabel() {
            if (!this.customizeFolderKey)
                return;
            this.closeCustomizeMenu();
            this.$emit('open-add-label', this.customizeFolderKey);
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-workspace-WorkspaceSidebar.css"></style>
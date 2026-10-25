<template>
  <div class="form-editor-subheader">
    
    <div class="subheader-left">
      <button class="btn-back-sm" @click="$router.push('/home')" title="Back to workspace">
        <i class="bi bi-arrow-left"></i>
      </button>
      <h6 class="form-title">{{ formTitle }}</h6>
      <div class="save-status" :class="{ 'is-saving': isSaving }">
        <i v-if="saveError" class="bi bi-exclamation-circle-fill text-danger"></i>
        <i v-else-if="isSaving" class="spinner-border spinner-border-sm me-1" style="width: 12px; height: 12px; border-width: 2px;" role="status"></i>
        <i v-else class="bi bi-check-circle-fill"></i>
        <span>{{ saveError ? 'Save failed' : isSaving ? 'Saving...' : 'All changes saved' }}</span>
      </div>
    </div>

    <div class="subheader-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="tab-item"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab; $emit('tab-changed', tab)"
      >
        {{ $label(`editor.${tab.toLowerCase()}`) }}
      </button>
    </div>

    <div class="subheader-right">
      <button class="btn-preview" @click="$emit('preview-clicked')">
        <i class="bi bi-eye me-1"></i>
        <span class="d-none d-md-inline">Preview</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
    name: 'FormEditorSubheader',
    props: {
        formTitle: { type: String, default: 'Form' },
        activeTabProp: { type: String, default: 'BUILD' },
        isSaving: { type: Boolean, default: false },
        saveError: { type: String, default: '' },
    },
    data() {
        return {
            activeTab: this.activeTabProp || 'BUILD',
            tabs: ['BUILD', 'SETTINGS', 'PUBLISH'],
        };
    },
    watch: {
        activeTabProp(v) { this.activeTab = v; },
    },
};
</script>

<style scoped src="@/assets/styles/components-builder-BuilderToolbar.css"></style>
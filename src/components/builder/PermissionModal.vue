<template>
  <div v-if="visible" class="access-modal-backdrop">
    <div class="access-modal card">
      <div class="modal-head d-flex justify-content-between align-items-center p-4">
        <h5 class="modal-title">Setting</h5>
        <button class="close-btn" @click="$emit('close')">
          <i class="bi bi-x"></i>
        </button>
      </div>

      <div class="divider"></div>

      <div class="p-4 modal-body">
        
        <h6 class="section-label">Permissions</h6>
        <div class="permissions-list mt-3">
          <label class="permission-row" :class="{ active: selectedPermission === 'submit_only' }">
            <div class="radio-wrap">
              <input type="radio" name="perm" :checked="selectedPermission === 'submit_only'" @change="setPermission('submit_only')" />
              <div class="radio-custom"></div>
            </div>
            <div class="perm-content">
              <div class="perm-title">Submit Only</div>
              <div class="perm-desc">Invited people can view and submit the form only.</div>
            </div>
          </label>

          <label class="permission-row mt-3" :class="{ active: selectedPermission === 'submit_and_view' }">
            <div class="radio-wrap">
              <input type="radio" name="perm" :checked="selectedPermission === 'submit_and_view'" @change="setPermission('submit_and_view')" />
              <div class="radio-custom"></div>
            </div>
            <div class="perm-content">
              <div class="perm-title">Submit &amp; View Later</div>
              <div class="perm-desc">Invited people can submit the form and view their submissions later.</div>
            </div>
          </label>
        </div>
      </div>

      <div class="modal-footer-custom d-flex justify-content-end align-items-center gap-3 p-4">
        <button class="btn-cancel" @click="$emit('close')">Cancel</button>
        <button class="btn-save" @click="save">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'AccessSettingsModal',
    props: {
        visible: { type: Boolean, default: false },
        initialPermission: { type: String, default: 'submit_and_view' } // 'submit_only' | 'submit_and_view'
    },
    data() {
        return {
            selectedPermission: this.initialPermission
        };
    },
    watch: {
        visible(newVal) {
            if (newVal)
                this.selectedPermission = this.initialPermission;
        }
    },
    methods: {
        setPermission(p) {
            this.selectedPermission = p;
        },
        save() {
            // emit the new settings back to the parent
            this.$emit('save', {
                permissionMode: this.selectedPermission
            });
            // close action left to parent via the save handler
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-builder-PermissionModal.css"></style>
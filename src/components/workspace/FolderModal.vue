<template>
  <div
    v-if="open"
    class="jf-customize-menu"
    :style="{ top: top + 'px', left: left + 'px' }"
  >

    <button class="jf-item" type="button" @click="$emit('change-name')">
      <i class="bi bi-pencil-fill"></i>
      <span>Change Name</span>
    </button>

    <button class="jf-item" type="button" @click="$emit('add-sublabel')">
      <i class="bi bi-folder-fill"></i>
      <span>Add Sublabel</span>
    </button>

    <div class="jf-item jf-static-item">
      <i class="bi bi-droplet-fill"></i>
      <span>Change Color</span>
    </div>

    <div class="jf-color-grid">
      <button
        v-for="color in colors"
        :key="color"
        type="button"
        class="jf-color-btn"
        :style="{ background: color }"
        @click="$emit('change-color', color)"
      ></button>
    </div>

    <button class="jf-item jf-delete" type="button" @click="$emit('delete-folder')">
      <i class="bi bi-trash-fill"></i>
      <span>Delete</span>
    </button>
  </div>
</template>

<script>
export default {
    name: 'CustomizeFolder',
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        top: {
            type: Number,
            default: 0,
        },
        left: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            colors: [
                '#1679db', '#4eaee7', '#b172db', '#c79de7', '#748ddd',
                '#0e9880', '#95cb2a', '#2898b2', '#5db4cf', '#f36f74',
                '#e8b9bc', '#ff6a00', '#f6a44a', '#fbbb2a', '#f4d977',
                '#39497a', '#ffffff',
            ],
        };
    },
};
</script>

<style scoped src="@/assets/styles/components-workspace-FolderModal.css"></style>

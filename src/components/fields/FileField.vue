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
      placeholder="File Upload"
      default-label="File Upload"
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      <div
        class="drop-zone"
        :class="{ dragging: isDragging }"
        @click="isActive && $refs.fileInput.click()"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
      >
        <span class="arrow arrow-left">◀</span>
        <span class="arrow arrow-right">▶</span>
        <span v-if="isActive" class="drag-handle">⠿</span>

        <div class="drop-content">
          <i class="fas fa-cloud-upload-alt upload-icon"></i>
          <p class="browse-text">Browse Files</p>
          <p class="drop-hint">Or drag and drop files here</p>
        </div>

        <input ref="fileInput" type="file" class="hidden-input" />
      </div>

      <p v-if="fileName" class="file-name">
        <i class="fas fa-paperclip mr-1"></i>{{ fileName }}
      </p>
    </template>

    <template v-else>
      <div
        class="fill-drop-zone"
        :class="{ dragging: isDragging, 'input-error': hasError }"
        @click="!readonly && $refs.fileInputPublic.click()"
        @dragover.prevent="!readonly && (isDragging = true)"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="!readonly && onDropPublic($event)"
      >
        <div class="drop-content">
          <i class="fas fa-cloud-upload-alt upload-icon"></i>
          <p class="browse-text">Browse Files</p>
          <p class="drop-hint">Or drag and drop files here</p>
        </div>
        <input ref="fileInputPublic" type="file" multiple class="hidden-input" @change="onFileChangePublic" />
      </div>
      <div v-if="answer" class="mt-2 file-info">
        <i class="bi bi-file-earmark-check text-success"></i>
        <ul class="file-name-list">
          <li v-for="(fileName, index) in displayFileNames" :key="`${fileName}-${index}`" class="file-name-text">
            {{ fileName }}
            <button
              v-if="!readonly"
              type="button"
              class="remove-file-btn"
              title="Remove file"
              @click.stop="removeFile(index)"
            >
              <i class="fas fa-trash"></i>
            </button>
          </li>
        </ul>
      </div>
    </template>

    <FormElementSublabel
      v-model="sublabel"
      :is-active="isActive"
      :mode="mode"
      placeholder="Type a sublabel"
      @update:modelValue="syncBuilderState"
    />

    <div v-if="isActive && mode === 'builder'" class="block-actions">
      <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
import FormElementSublabel from '@/components/fields/FieldSublabel.vue';
export default {
    name: 'FileUploadBlock',
    components: {
        FormElementLabel,
        FormElementSublabel
    },
    emits: ['update:label', 'update:settings', 'delete', 'file-selected', 'remove-file'],
    props: {
        label: { type: String, default: 'File Upload' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        answer: { type: [String, Array, Object], default: '' },
        answerName: { type: [String, Array], default: '' },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
      computed: {
        displayFileNames() {
          return Array.isArray(this.answerName)
            ? this.answerName
            : [this.answerName || 'File Selected'];
        },
      },
    data() {
        return {
            localLabel: this.label,
            sublabel: this.elSettings?.sublabel || '',
            isDragging: false,
            fileName: '',
        };
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                this.syncBuilderState();
            }
        },
        label(v) { if (this.mode === 'builder')
            this.localLabel = v; },
        'elSettings.sublabel'(v) { this.sublabel = v; }
    },
    methods: {
        syncBuilderState() {
            const nextSettings = {
                ...this.elSettings,
                sublabel: this.sublabel,
            };
            delete nextSettings.labelKey;
            this.$emit('update:label', this.localLabel);
            this.$emit('update:settings', nextSettings);
        },
        onFileChangePublic(e) {
          const files = Array.from(e.target.files);
          if (files.length) this.$emit('file-selected', files);
        },
        onDropPublic(e) {
          this.isDragging = false;
          const files = Array.from(e.dataTransfer.files);
          if (files.length) this.$emit('file-selected', files);
        },
        removeFile(index) {
          this.$emit('remove-file', index);
          if (this.$refs.fileInputPublic) {
            this.$refs.fileInputPublic.value = '';
          }
        }
   },
};
</script>

<style scoped src="@/assets/styles/components-fields-FileField.css"></style>
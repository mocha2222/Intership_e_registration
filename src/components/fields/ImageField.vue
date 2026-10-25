<template>
  <div
    class="block-wrapper"
    :class="{ 'edit-mode': isActive && mode === 'builder', 'public-mode': mode === 'public' }"
  >
    
    <template v-if="mode === 'builder'">
      
      <FormElementLabel
        v-model="localLabel"
        :label-key="elSettings?.labelKey"
        :is-active="isActive"
        :mode="mode"
        placeholder="Image"
        default-label="Image"
        @edit="syncBuilderState"
      />

      <div
        class="image-box"
        :class="{ 'edit-mode': isActive }"
        @click="isActive && $refs.imgInput.click()"
      >
        <img v-if="previewUrl" :src="$resolveImg(previewUrl)" class="preview-img" alt="image" />
        <div v-else class="placeholder-content">
          <svg class="placeholder-icon" viewBox="0 0 100 75" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="75" rx="6" fill="#e8eaf0"/>
            <circle cx="32" cy="26" r="9" fill="#b0bcd0"/>
            <polygon points="0,75 36,35 62,56 74,42 100,75" fill="#b0bcd0"/>
          </svg>
          <p v-if="isActive" class="upload-hint-text">
            <i class="fas fa-plus-circle mr-1"></i>Upload Image
          </p>
        </div>
      </div>
      <input ref="imgInput" type="file" accept="image/*" class="hidden-input" @change="onImgChange" />

      <button v-if="isActive && previewUrl" class="remove-img-btn" @click.stop="removeImage">
        <i class="fas fa-times mr-1"></i>Remove Image
      </button>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      <FormElementLabel
        v-model="localLabel"
        :label-key="elSettings?.labelKey"
        :is-active="isActive"
        :mode="mode"
        default-label="Image"
      />
      <div
        class="image-box"
      >
        <img v-if="publicUrl" :src="publicUrl" class="preview-img" alt="image" />

        <div v-else class="placeholder-content">
          <svg class="placeholder-icon" viewBox="0 0 100 75" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="75" rx="6" fill="#e8eaf0"/>
            <circle cx="32" cy="26" r="9" fill="#b0bcd0"/>
            <polygon points="0,75 36,35 62,56 74,42 100,75" fill="#b0bcd0"/>
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'ImageBlock',
    components: {
        FormElementLabel
    },
    emits: ['update:settings', 'delete', 'update:answer', 'update:label'],
    props: {
        label: { type: String, default: '' },
        elSettings: { type: Object, default: () => ({ url: '', labelKey: '', imageUrl: '' }) },
        mode: { type: String, default: 'builder' },
        answer: { type: String, default: '' },
        isActive: { type: Boolean, default: false },
        readonly: { type: Boolean, default: false },
    },
    data() {
        return {
            localLabel: this.label,
            previewUrl: this.elSettings?.imageUrl || this.elSettings?.url || '',
            publicUrl: this.answer || this.elSettings?.imageUrl || this.elSettings?.url || '',
        };
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                this.syncBuilderState();
            }
        },
        label(val) { if (this.mode === 'builder')
            this.localLabel = val; },
        'elSettings.imageUrl'(val) { if (this.mode === 'builder' && !this.isActive)
            this.previewUrl = val; },
        'elSettings.url'(val) { if (this.mode === 'builder' && !this.isActive)
            this.previewUrl = val; },
        answer(val) { if (this.mode !== 'builder')
            this.publicUrl = val || ''; }
    },
    methods: {
        syncBuilderState() {
            const newSettings = { ...this.elSettings };
            delete newSettings.labelKey;
            this.$emit('update:settings', newSettings);
            this.$emit('update:label', this.localLabel);
        },
        onImgChange(e) {
            const file = e.target.files[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.previewUrl = ev.target.result;
                this.$emit('update:settings', { ...this.elSettings, url: ev.target.result, imageUrl: ev.target.result });
            };
            reader.readAsDataURL(file);
        },
        onImgChangePublic(e) {
            const file = e.target.files[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.publicUrl = ev.target.result;
                this.$emit('update:answer', ev.target.result);
            };
            reader.readAsDataURL(file);
        },
        removeImage() {
            if (this.$refs.imgInput)
                this.$refs.imgInput.value = '';
            this.previewUrl = '';
            this.$emit('update:settings', { ...this.elSettings, url: '', imageUrl: '' });
        },
        removeImagePublic() {
            if (this.$refs.imgInputPublic)
                this.$refs.imgInputPublic.value = '';
            this.publicUrl = '';
            this.$emit('update:answer', '');
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-ImageField.css"></style>
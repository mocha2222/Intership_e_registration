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
      placeholder="Paragraph"
      default-label=""
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      
      <div
        ref="editor"
        class="editor-area"
        :class="{ 'editor-active': isActive && !readonly }"
                :contenteditable="isActive && !readonly"
                @input="onInput"
        @click.stop
      ></div>

      <p v-if="!isActive && !content" class="view-placeholder">Paragraph text will appear here…</p>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      
      <div
        ref="editorPublic"
        class="editor-area editor-active"
        :class="{ 'input-error': hasError }"
        :contenteditable="!readonly"
        @input="onInputPublic"
        @click.stop
      ></div>

      <div v-if="!readonly" class="editor-footer" @click.stop>
        <span class="footer-tag">p</span>
        <span class="footer-count">{{ charCount }} / 60000</span>
      </div>
    </template>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'ParagraphBlock',
    components: {
        FormElementLabel
    },
    emits: ['update:settings', 'delete', 'settings', 'update:answer', 'update:label'],
    props: {
        label: { type: String, default: '' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        answer: { type: String, default: '' },
        isActive: { type: Boolean, default: false },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
    data() {
        return {
            localLabel: this.label,
            content: this.elSettings?.content || '',
            publicContent: this.answer || '',
            charCount: 0,
        };
    },
    computed: {
        displayContent() {
            if (this.mode === 'public') {
                return this.publicContent;
            }
            return this.content;
        }
    },
    watch: {
        isActive(val) {
            if (this.mode === 'builder') {
                if (val && !this.readonly) {
                    this.$nextTick(() => {
                        if (this.$refs.editor) {
                            this.$refs.editor.innerHTML = this.content;
                            this.$refs.editor.focus();
                        }
                    });
                }
                else if (!val) {
                    this.syncBuilderState();
                }
            }
        },
        'elSettings.content'(val) {
            if (this.mode === 'builder' && !this.isActive) {
                this.content = val;
                if (this.$refs.editor)
                    this.$refs.editor.innerHTML = val;
            }
        }
    },
    methods: {
        syncBuilderState() {
            const newSettings = { ...this.elSettings };
            delete newSettings.labelKey;
            this.$emit('update:label', this.localLabel);
            this.$emit('update:settings', { ...newSettings, content: this.content });
        },
        onInput() {
            if (this.$refs.editor) {
                this.content = this.$refs.editor.innerHTML;
                this.charCount = this.$refs.editor.innerText.length;
            }
        },
        onInputPublic() {
            if (this.$refs.editorPublic) {
                this.publicContent = this.$refs.editorPublic.innerHTML;
                this.charCount = this.$refs.editorPublic.innerText.length;
                this.$emit('update:answer', this.publicContent);
            }
        },
        exec(cmd) {
            document.execCommand(cmd, false, null);
        }
    },
    mounted() {
        this.$nextTick(() => {
            const initVal = this.displayContent || '';
            if (this.mode === 'builder' && this.$refs.editor) {
                this.$refs.editor.innerHTML = initVal;
                this.charCount = this.$refs.editor.innerText.length;
            }
            else if (this.mode === 'public' && this.$refs.editorPublic) {
                this.$refs.editorPublic.innerHTML = initVal;
                this.charCount = this.$refs.editorPublic.innerText.length;
            }
        });
    }
};
</script>

<style scoped src="@/assets/styles/components-fields-ParagraphElement.css"></style>
<template>
  <FormLayout>
    <Header />
    <div class="sub-header-spacer"></div>
    <p v-if="saveError" class="alert alert-danger" role="alert">{{ saveError }}</p>
    <FormEditorSubheader
      :formTitle="formTitle"
      :activeTabProp="activeTab"
      :isSaving="isSaving"
      :saveError="saveError"
      @tab-changed="handleTabChange"
      @preview-clicked="showPreview = true"
    />

    <BuilderPreview v-if="showPreview"
      :formTitle="formTitle"
      :pageContainerStyle="pageContainerStyle"
      :formStyle="formStyle"
      :logoBannerElement="logoBannerElement"
      :logoBannerStyle="logoBannerStyle"
      :inputBgColor="inputBgColor"
      :pages="pages"
      @close="showPreview = false"
    />

    <div
      class="form-editor-container"
      :style="pageContainerStyle"
      @click="selectedElementId = null"
    >
      <div class="form-canvas-wrapper" :class="{ 'no-scroll': showFormElements || showFormDesigner }">

        <div class="canvas-side-controls">
          <button class="add-element-btn" :class="{ active: showFormElements }" @click="showFormElements = !showFormElements">
            <i class="bi bi-plus-lg"></i> <span>Add Element</span>
          </button>
          <button class="appearance-btn" :class="{ active: showFormDesigner }" @click="showFormDesigner = !showFormDesigner">
            <i class="bi bi-pencil-fill me-1"></i><span>Appearance</span>
          </button>
        </div>

        <div class="logo-area">
          <div class="logo-row">
            <div v-for="(logo, index) in formLogoUrls" :key="`${index}-${logo}`" class="logo-container">
              <img :src="$resolveImg(logo)" class="logo-preview" alt="Logo" />
              <button class="remove-logo-btn" @click="removeLogo(index)" title="Remove Logo">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            <button class="add-logo-btn" @click="$refs.logoFileInput.click()">
              <span class="add-logo-inner">
                <i class="bi bi-plus-lg"></i>
              </span>
            </button>
          </div>
          <input ref="logoFileInput" type="file" accept="image/*" multiple class="hidden-input" @change="handleFormLogo" />
        </div>

        <div v-for="(page, pageIdx) in pages" :key="pageIdx" class="page-section">
          <div v-if="pages.length > 1 && pageIdx > 0" class="page-label-row">
            <span class="page-label">{{ $label('editor.pageIndicator', { current: pageIdx + 1, total: pages.length }) }}</span>
            <button class="remove-page-btn" @click="removePage(pageIdx)">
              <i class="bi bi-x"></i> Remove page
            </button>
          </div>

          <div v-if="pageIdx === 0 && !logoBannerElement" class="form-title-block">
            <input
              type="text"
              class="form-canvas-title-input"
              v-model="formTitle"
              :style="{ color: fontColor, fontFamily: formStyle.fontFamily }"
              @input="save"
              placeholder="Form Title"
            />
          </div>

          <FormCanvas :style="{ ...formStyle, '--input-bg': inputBgColor }">
            <div class="canvas-content">
              <div v-if="page.elements.length === 0" class="empty-state text-center">
                <img src="@/assets/emptyElement.png" alt="Empty Canvas" class="empty-state-img" />
                <p class="empty-text">Click &quot;Add Element&quot; to add your first field</p>
              </div>

              <div
                v-for="(el, elIdx) in page.elements"
                :key="el.id"
                class="canvas-block"
                draggable="true"
                :class="{ 
                  'drag-over': dragOverIndex === elIdx && dragOverPage === pageIdx,
                  'active-block': selectedElementId === el.id,
                  'first-canvas-block': elIdx === 0
                }"
                @dragstart="onDragStart(pageIdx, elIdx, $event)"
                @dragover.prevent="onDragOver(pageIdx, elIdx)"
                @dragleave="onDragLeave"
                @drop.prevent="onDrop(pageIdx, elIdx)"
                @dragend="onDragEnd"
                @click.stop="selectElement(el.id)"
              >
                <FieldEditor
                  :el="el"
                  :is-active="selectedElementId === el.id"
                  @change="save"
                  @commit="save"
                  @delete="removeElement(pageIdx, el.id)"
                />
              </div>

            </div>
          </FormCanvas>

          <div class="form-footer">
            <button v-if="pageIdx < pages.length - 1" class="next-btn" :style="{ fontFamily: formStyle.fontFamily }">Next Page</button>
            <button v-else class="submit-btn" :style="{ fontFamily: formStyle.fontFamily }">Submit</button>
          </div>
        </div>

        <div class="form-actions">
          <button class="add-page-btn" @click="addPage">
            <i class="bi bi-plus-circle"></i> Add New Page
          </button>
        </div>
      </div>

      <FormElement v-if="showFormElements" :open="showFormElements" @close="showFormElements=false" @select-element="handleSelectElement" />
      <FormDesign  v-if="showFormDesigner" :open="showFormDesigner" :currentDesign="currentDesign" @close="showFormDesigner=false" @color-change="handleFormDesignColor" />
    </div>
  </FormLayout>
</template>

<script>
import BuilderPreview from "@/components/builder/BuilderPreview.vue";
import FormLayout from "@/layouts/FormLayout.vue";
import FormCanvas from "@/components/builder/FormCanvas.vue";
import FieldEditor from "@/components/builder/FieldEditor.vue";
import Header from '@/components/common/AppHeader.vue';
import FormEditorSubheader from '@/components/builder/BuilderToolbar.vue';
import FormElement from '@/components/builder/FieldPalette.vue';
import FormDesign from '@/components/builder/FormDesignPanel.vue';
import { getForm, createForm, saveForm } from '@/store/formStore';
import { getMyForm } from '@/api/formsApi';
import { loadGoogleFont, normalizeFontFamily } from '@/utils/fontLoader';
import { apiFormToStore } from '@/utils/mapper';
export default {
    name: 'FormPage',
    components: {
        BuilderPreview,
        FormLayout, FormCanvas,
        FieldEditor,
        Header, FormEditorSubheader, FormElement, FormDesign,
    },
    data() {
        const formId = this.$route.params.id || 'default';
        return {
            formId,
            storeForm: null,
            formTitle: 'Loading...',
            pages: [{ elements: [] }],
            activeTab: 'BUILD',
            showFormElements: false,
            showFormDesigner: false,
            showPreview: false,
            currentPreviewPage: 0,
            previewDevice: 'laptop',
            formLogoUrl: '',
            formBgColor: '#FFFFFF',
            pageBgColor: '#f0f2f8',
            fontColor: '#2C3345',
            inputBgColor: '#FFFFFF',
            pageBgImage: '',
            formBgImage: '',
            fontFamily: 'Inter',
            nextElementId: 1,
            selectedElementId: null,
            // Drag state
            dragPageIdx: null,
            dragElIdx: null,
            dragOverPage: null,
            dragOverIndex: null,
            isSaving: false,
            saveError: '',
        };
    },
    computed: {
        formLogoUrls() {
            return this.parseLogoUrls(this.formLogoUrl);
        },
        serializedLogoUrl() {
            const logos = this.formLogoUrls;
            if (logos.length === 0)
                return '';
            if (logos.length === 1)
                return logos[0];
            return JSON.stringify(logos);
        },
        currentDesign() {
            return {
                pageBgColor: this.pageBgColor,
                formBgColor: this.formBgColor,
                fontColor: this.fontColor,
                inputBgColor: this.inputBgColor,
                pageBgImage: this.pageBgImage,
                formBgImage: this.formBgImage,
                fontFamily: this.fontFamily,
            };
        },
        pageContainerStyle() {
            return {
                background: `var(--designer-page-bg, ${this.pageBgColor})`,
                backgroundImage: this.pageBgImage ? `url(${this.$resolveImg(this.pageBgImage)})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            };
        },
        formStyle() {
            return {
                background: `var(--designer-form-bg, ${this.formBgColor})`,
                backgroundImage: this.formBgImage ? `url(${this.$resolveImg(this.formBgImage)})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                fontFamily: `"${this.fontFamily}", sans-serif`,
            };
        },
        previewFrameStyle() {
            const widths = { phone: '375px', tablet: '768px', laptop: '1024px' };
            return { width: widths[this.previewDevice] || '1024px', maxWidth: '100%' };
        },
        logoBannerElement() {
            if (!this.pages)
                return null;
            for (const page of this.pages) {
                const found = page.elements.find(el => el.type === 'logobanner' && (el.settings?.imageUrl || el.settings?.url));
                if (found)
                    return found;
            }
            return null;
        },
        logoBannerStyle() {
            const el = this.logoBannerElement;
            if (!el)
                return {};
            const style = {
                width: el.settings?.width || '100%',
                overflow: 'hidden',
                position: 'relative'
            };
            const height = el.settings?.height || '160px';
            if (height.endsWith('px')) {
                const pxVal = parseInt(height);
                if (!isNaN(pxVal) && pxVal > 0) {
                    style.height = 'auto';
                    style.aspectRatio = `800 / ${pxVal}`;
                }
                else {
                    style.height = height;
                }
            }
            else {
                style.height = height;
            }
            return style;
        },
    },
    async mounted() {
        await this.initForm();
    },
    beforeUnmount() {
        // Flush pending saves
        if (this._saveTimer && this.storeForm) {
            clearTimeout(this._saveTimer);
            saveForm(this.storeForm).catch(error => console.warn('Could not finish saving:', error));
        }
    },
    watch: {
        '$route.params.id': {
            handler() { this.initForm(); },
        },
        showPreview(val) {
            if (val)
                this.currentPreviewPage = 0;
        },
        fontFamily(newFont) {
            loadGoogleFont(newFont);
        }
    },
    methods: {
        // Parse the logo URL into a list of individual logo URLs
        parseLogoUrls(value) {
            if (!value || value === 'null')
                return [];
            if (Array.isArray(value))
                return value.filter(Boolean);
            if (typeof value !== 'string')
                return [];
            const trimmed = value.trim();
            if (!trimmed)
                return [];
            if (trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed))
                        return parsed.filter(Boolean);
                }
                catch {
                    // Fall back to legacy single-logo handling
                }
            }
            return [value];
        },
        // Fetch and initialize form properties from the database/API
        async initForm() {
            const formId = this.$route.params.id;
            if (!formId || formId === 'default')
                return;
            this.formId = formId;
            try {
                let sf = getForm(String(formId));
                if (!sf) {
                    sf = apiFormToStore(await getMyForm(formId));
                }
                const design = sf.design;
                this.storeForm = sf;
                this.formTitle = sf.title;
                this.pages = sf.pages;
                this.formLogoUrl = sf.logoUrl || '';
                this.formBgColor = design.formBgColor || '#FFFFFF';
                this.pageBgColor = design.pageBgColor || '#f0f2f8';
                this.fontColor = design.fontColor || '#2C3345';
                this.inputBgColor = design.inputBgColor || '#FFFFFF';
                this.pageBgImage = design.pageBgImage || '';
                this.formBgImage = design.formBgImage || '';
                this.fontFamily = normalizeFontFamily(design.fontFamily || 'Inter');
                loadGoogleFont(this.fontFamily);
                this.nextElementId = sf.nextElementId || 1;
            }
            catch (err) {
                if (err.status === 403 || err.status === 404) {
                    alert("You don't have permission to edit this form, or it doesn't exist.");
                    this.$router.push('/home');
                }
                else {
                    console.error("Failed to fetch form:", err);
                    alert("Failed to load form. Redirecting...");
                    this.$router.push('/home');
                }
            }
        },
        // Set the currently active/selected form element in editor
        selectElement(id) {
            if (this.selectedElementId === id)
                return;
            this.selectedElementId = id;
        },
        // Synchronize local UI state into the persistent storeForm object
        syncStoreFormForSave() {
            if (!this.storeForm)
                return false;
            this.storeForm.title = this.formTitle;
            this.storeForm.pages = JSON.parse(JSON.stringify(this.pages));
            this.storeForm.nextElementId = this.nextElementId;
            this.storeForm.logoUrl = this.serializedLogoUrl;
            this.storeForm.design = { ...this.currentDesign };
            const now = new Date();
            this.storeForm.updated_at = now.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            return true;
        },
        save() {
            if (!this.syncStoreFormForSave())
                return;
            this.isSaving = true;
            clearTimeout(this._saveTimer);
            this._saveTimer = setTimeout(async () => {
                try {
                    await saveForm(this.storeForm);
                    this.saveError = '';
                }
                catch (error) {
                    this.saveError = error.message || 'Could not save your changes.';
                }
                finally {
                    this.isSaving = false;
                }
            }, 800);
        },
        // Convert and append uploaded logo images to base64 urls
        handleFormLogo(e) {
            const files = Array.from(e.target?.files || (e ? [e] : [])).filter(Boolean);
            if (files.length === 0)
                return;
            Promise.all(files.map(file => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = ev => resolve(ev.target.result);
                reader.readAsDataURL(file);
            }))).then((newLogos) => {
                const logos = [...this.formLogoUrls, ...newLogos];
                this.formLogoUrl = logos.length === 1 ? logos[0] : JSON.stringify(logos);
                this.save();
            });
            if (e.target)
                e.target.value = '';
        },
        // Remove a logo from the list
        removeLogo(index) {
            const logos = this.formLogoUrls.filter((_, logoIndex) => logoIndex !== index);
            this.formLogoUrl = logos.length <= 1 ? (logos[0] || '') : JSON.stringify(logos);
            this.save();
        },
        // Add a new page to the form
        addPage() {
            this.pages.push({ elements: [] });
            this.save();
        },
        // Remove a page from the form (min 1 page remains)
        removePage(idx) {
            if (this.pages.length > 1) {
                this.pages.splice(idx, 1);
                this.save();
            }
        },
        // Remove a specific element from a page
        removeElement(pageIdx, id) {
            this.pages[pageIdx].elements = this.pages[pageIdx].elements.filter(el => el.id !== id);
            this.save();
        },
        // Insert a new form element at the end of the last page
        handleSelectElement(element) {
            const page = this.pages[this.pages.length - 1];
            const id = this.nextElementId++;
            const map = {
                'Heading': { type: 'heading', text: 'Heading', subtext: 'subheader', settings: { headingKey: 'elements.heading' } },
                'Full Name': { type: 'fullname', label: 'Full Name', firstName: '', lastName: '', settings: { labelKey: 'elements.fullName' } },
                'Address': { type: 'address', label: 'Address', address: { street1: '', street2: '', city: '', state: '', postal: '' }, settings: { labelKey: 'elements.address' } },
                'Email': { type: 'email', label: 'Email', placeholder: 'example@example.com', settings: { labelKey: 'elements.email' } },
                'Date': { type: 'date', label: 'Date', settings: { labelKey: 'elements.date' } },
                'Phone': { type: 'phonenumber', label: 'Phone Number', settings: { labelKey: 'elements.phone' } },
                'Dropdown': { type: 'dropdown', label: 'Dropdown', options: ['Option 1', 'Option 2'], settings: { labelKey: 'elements.dropdown' } },
                'Number': { type: 'number', label: 'Number', settings: { labelKey: 'elements.number' } },
                'Single Choice': { type: 'singlechoice', label: 'Single Choice', options: ['Option 1', 'Option 2'], settings: { labelKey: 'elements.singleChoice' } },
                'Multiple Choice': { type: 'multiplechoice', label: 'Multiple Choice', options: ['Option 1', 'Option 2'], settings: { labelKey: 'elements.multipleChoice' } },
                'Image': { type: 'image', label: 'Image', settings: { labelKey: 'elements.image' } },
                'File Upload': { type: 'fileupload', label: 'File Upload', settings: { labelKey: 'elements.fileUpload' } },
                'Input Table': { type: 'tableinput', label: 'Input Table', columns: ['Column 1', 'Column 2'], rows: ['Row 1', 'Row 2'], settings: { labelKey: 'elements.inputTable' } },
                'Star Rating': { type: 'starrating', label: 'Star Rating', settings: { labelKey: 'elements.starRating' } },
                'Scale Rating': { type: 'scalerating', label: 'Scale Rating', scaleMax: 5, minLabel: 'Worst', maxLabel: 'Best', settings: { labelKey: 'elements.scaleRating' } },
                'Logo Banner': { type: 'logobanner', label: 'Logo Banner', settings: { labelKey: 'elements.logoBanner', width: '100%', height: '160px', imageUrl: '', panX: 0, panY: 0 } },
                'Short Text': { type: 'shorttext', label: 'Type a question', settings: { labelKey: 'elements.shortText' } },
                'Long Text': { type: 'longtext', label: 'Type a question', settings: { labelKey: 'elements.longText' } },
                'Paragraph': { type: 'paragraph' },
            };
            const item = map[element.name];
            if (item) {
                page.elements.push({ id, ...item, settings: item.settings || {} });
                this.save();
            }
        },
        // Route to another tab within form setup (BUILD, SETTINGS, PUBLISH)
        handleTabChange(tab) {
            this.activeTab = tab;
            if (tab === 'SETTINGS') {
                this.$router.push({ name: 'formSettings', params: { id: this.formId } });
            }
            else if (tab === 'PUBLISH') {
                this.$router.push({ name: 'FormShare', params: { id: this.formId } });
            }
            else if (['formSettings', 'formShare'].includes(this.$route.name)) {
                this.$router.push({ name: 'formEditor', params: { id: this.formId } });
            }
        },
        // Update form visual theme values and save
        handleFormDesignColor({ formColor, pageColor, fontColor, inputBgColor, pageBgImage, formBgImage, fontFamily }) {
            if (formColor)
                this.formBgColor = formColor;
            if (pageColor)
                this.pageBgColor = pageColor;
            if (fontColor)
                this.fontColor = fontColor;
            if (inputBgColor)
                this.inputBgColor = inputBgColor;
            if (pageBgImage !== undefined)
                this.pageBgImage = pageBgImage;
            if (formBgImage !== undefined)
                this.formBgImage = formBgImage;
            if (fontFamily)
                this.fontFamily = fontFamily;
            this.save();
        },
        // ── Drag & Drop ──
        // Triggered when user starts dragging an element
        onDragStart(pageIdx, elIdx, e) {
            this.dragPageIdx = pageIdx;
            this.dragElIdx = elIdx;
            e.dataTransfer.effectAllowed = 'move';
        },
        // Triggered when dragging over an element location
        onDragOver(pageIdx, elIdx) {
            this.dragOverPage = pageIdx;
            this.dragOverIndex = elIdx;
        },
        // Triggered when leaving a drag target
        onDragLeave() {
            this.dragOverPage = null;
            this.dragOverIndex = null;
        },
        // Complete the drag-and-drop operation
        onDrop(targetPageIdx, targetElIdx) {
            if (this.dragPageIdx === null || this.dragElIdx === null)
                return;
            if (this.dragPageIdx === targetPageIdx) {
                const els = this.pages[targetPageIdx].elements;
                const [moved] = els.splice(this.dragElIdx, 1);
                els.splice(targetElIdx, 0, moved);
            }
            this.dragOverPage = null;
            this.dragOverIndex = null;
            this.save();
        },
        // Reset drag-and-drop state variables
        onDragEnd() {
            this.dragPageIdx = null;
            this.dragElIdx = null;
            this.dragOverPage = null;
            this.dragOverIndex = null;
        },
    },
};
</script>

<style scoped src="@/assets/styles/views-FormPage.css"></style>

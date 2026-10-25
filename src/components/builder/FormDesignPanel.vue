<template>
  <transition name="drawer-right">
    <div v-if="open" class="form-designer-modal" @click.self="closeModal">
      <div class="form-designer-panel" @wheel.stop>
        
        <div class="form-designer-header d-flex align-items-center justify-content-between">
          <h5 class="mb-0">Form Designer</h5>
          <button class="btn-close-designer" @click="closeModal">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="form-designer-tabs">
          <button
            v-for="tab in tabs"
            :key="tab"
            class="tab-btn"
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <div class="form-designer-content">
          
          <div v-if="activeTab === 'COLORS'" class="tab-content animate-fade">
            
            <div class="designer-section">
              <h6 class="section-title">Color Scheme</h6>
              <div class="color-scheme-grid">
                <div
                  v-for="(color, index) in colorSchemes"
                  :key="'scheme-' + index"
                  class="color-swatch"
                  :class="{ active: selectedColorScheme === index }"
                  :style="{ borderColor: color.border, backgroundColor: color.bg }"
                  @click="applyColorScheme(index)"
                  :title="color.name"
                >
                  <span class="scheme-letter" :style="{ color: color.fontColor || '#333' }">A</span>
                </div>
              </div>
            </div>

            <div class="designer-section">
              <div class="row g-2">
                <div class="col-7">
                  <h6 class="section-title">Page Color</h6>
                  <div class="color-input-group">
                    <input v-model="pageColor" type="text" class="form-control color-hex-input" maxlength="7" placeholder="#F3F3FE" />
                  </div>
                </div>
                <div class="col-5">
                  <h6 class="section-title">&nbsp;</h6>
                  <input v-model="pageColor" type="color" class="form-control color-picker" />
                </div>
              </div>
            </div>

            <div class="designer-section">
              <h6 class="section-title">Page Image</h6>
              <div class="d-flex gap-2">
                <div class="file-upload-btn flex-grow-1">
                  <i class="bi bi-image"></i>
                  <span v-if="pageBgImageName">{{ pageBgImageName }}</span>
                  <span v-else-if="pageBgImage && pageBgImage !== 'none'">Image active</span>
                  <span v-else>Choose a file</span>
                  <input type="file" accept="image/*" @change="handlePageImageUpload" />
                </div>
                <button v-if="pageBgImage && pageBgImage !== 'none'" type="button" class="btn-remove-img" @click.stop="removePageImage" title="Remove Page Image">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <div class="designer-section">
              <div class="row g-2">
                <div class="col-7">
                  <h6 class="section-title">Form Color</h6>
                  <input v-model="formColor" type="text" class="form-control color-hex-input" maxlength="7" placeholder="#FFFFFF" />
                  <p class="section-hint">Change form background color</p>
                </div>
                <div class="col-5">
                  <h6 class="section-title">&nbsp;</h6>
                  <input v-model="formColor" type="color" class="form-control color-picker" />
                </div>
              </div>
            </div>

            <div class="designer-section">
              <h6 class="section-title">Form Image</h6>
              <div class="d-flex gap-2">
                <div class="file-upload-btn flex-grow-1">
                  <i class="bi bi-image"></i>
                  <span v-if="formBgImageName">{{ formBgImageName }}</span>
                  <span v-else-if="formBgImage && formBgImage !== 'none'">Image active</span>
                  <span v-else>Choose a file</span>
                  <input type="file" accept="image/*" @change="handleFormImageUpload" />
                </div>
                <button v-if="formBgImage && formBgImage !== 'none'" type="button" class="btn-remove-img" @click.stop="removeFormImage" title="Remove Form Image">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <div class="designer-section">
              <div class="row g-2">
                <div class="col-7">
                  <h6 class="section-title">Font Color</h6>
                  <input v-model="fontColor" type="text" class="form-control color-hex-input" maxlength="7" placeholder="#2C3345" />
                  <p class="section-hint">Change all form font colors</p>
                </div>
                <div class="col-5">
                  <h6 class="section-title">&nbsp;</h6>
                  <input v-model="fontColor" type="color" class="form-control color-picker" />
                </div>
              </div>
            </div>

            <div class="designer-section">
              <div class="row g-2">
                <div class="col-7">
                  <h6 class="section-title">Input Background</h6>
                  <input v-model="inputBackground" type="text" class="form-control color-hex-input" maxlength="7" placeholder="#FFFFFF" />
                </div>
                <div class="col-5">
                  <h6 class="section-title">&nbsp;</h6>
                  <input v-model="inputBackground" type="color" class="form-control color-picker" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'TYPOGRAPHY'" class="tab-content animate-fade">
            <div class="designer-section">
              <h6 class="section-title">Font Family</h6>

              <div class="font-dropdown-container">
                <div class="search-input-wrapper mb-3">
                  <i class="bi bi-search search-icon"></i>
                  <input
                    v-model="fontSearchQuery"
                    type="text"
                    class="form-control font-search-input"
                    placeholder="Search Fonts"
                  />
                  <button v-if="fontSearchQuery" class="clear-search-btn" @click="fontSearchQuery = ''">
                    <i class="bi bi-x"></i>
                  </button>
                </div>

                <div class="font-list-scroll">
                  <div
                    v-for="font in filteredFonts"
                    :key="font"
                    class="font-item"
                    :class="{ active: fontFamily === font }"
                    :style="{ fontFamily: `'${font}', sans-serif` }"
                    @click="selectFont(font)"
                  >
                    <span class="font-name-text">{{ font }}</span>
                    <i v-if="fontFamily === font" class="bi bi-check-lg select-check"></i>
                  </div>
                  <div v-if="filteredFonts.length === 0" class="empty-fonts-message">
                    No fonts match your search
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { POPULAR_GOOGLE_FONTS, loadGoogleFont, normalizeFontFamily } from '@/utils/fontLoader';
export default {
    name: 'FormDesign',
    props: {
        open: { type: Boolean, default: false },
        currentDesign: { type: Object, default: null },
    },
    data() {
        const d = this.currentDesign || {};
        const initialFont = normalizeFontFamily(d.fontFamily || 'Inter');
        loadGoogleFont(initialFont);
        return {
            activeTab: 'COLORS',
            tabs: ['COLORS', 'TYPOGRAPHY'],
            selectedColorScheme: 0,
            pageColor: d.pageBgColor || '#f0f2f8',
            formColor: d.formBgColor || '#FFFFFF',
            fontColor: d.fontColor || '#2C3345',
            inputBackground: d.inputBgColor || '#FFFFFF',
            pageBgImage: d.pageBgImage || '',
            formBgImage: d.formBgImage || '',
            fontFamily: initialFont,
            fontSearchQuery: '',
            pageBgImageName: '',
            formBgImageName: '',
            colorSchemes: [
                { name: 'White', bg: '#FFFFFF', border: '#E0E0E0', fontColor: '#333333' },
                { name: 'Teal', bg: '#B2DFDB', border: '#00897B', fontColor: '#004D40' },
                { name: 'Orange', bg: '#FFE0B2', border: '#F57C00', fontColor: '#E65100' },
                { name: 'Cream', bg: '#FFF8E1', border: '#F9A825', fontColor: '#5D4037' },
                { name: 'Green', bg: '#C8E6C9', border: '#43A047', fontColor: '#1B5E20' },
                { name: 'Dark', bg: '#455A64', border: '#263238', fontColor: '#ECEFF1' },
                { name: 'Pink', bg: '#F8BBD0', border: '#C2185B', fontColor: '#880E4F' },
                { name: 'Blue', bg: '#BBDEFB', border: '#1565C0', fontColor: '#0D47A1' },
                { name: 'Purple', bg: '#E1BEE7', border: '#7B1FA2', fontColor: '#4A148C' },
            ],
        };
    },
    computed: {
        filteredFonts() {
            const q = this.fontSearchQuery.toLowerCase().trim();
            if (!q)
                return POPULAR_GOOGLE_FONTS;
            return POPULAR_GOOGLE_FONTS.filter(font => font.toLowerCase().includes(q));
        }
    },
    watch: {
        pageColor() { this.emitColorChange(); },
        formColor() { this.emitColorChange(); },
        fontColor() { this.emitColorChange(); },
        inputBackground() { this.emitColorChange(); },
        pageBgImage() { this.emitColorChange(); },
        formBgImage() { this.emitColorChange(); },
        fontFamily() { this.emitColorChange(); },
        currentDesign: {
            deep: true,
            handler(newVal) {
                if (!newVal)
                    return;
                this.pageColor = newVal.pageBgColor || '#f0f2f8';
                this.formColor = newVal.formBgColor || '#FFFFFF';
                this.fontColor = newVal.fontColor || '#2C3345';
                this.inputBackground = newVal.inputBgColor || '#FFFFFF';
                this.pageBgImage = newVal.pageBgImage || '';
                this.formBgImage = newVal.formBgImage || '';
                this.fontFamily = normalizeFontFamily(newVal.fontFamily || 'Inter');
                loadGoogleFont(this.fontFamily);
            }
        }
    },
    methods: {
        closeModal() { this.$emit('close'); },
        applyColorScheme(index) {
            this.selectedColorScheme = index;
            const scheme = this.colorSchemes[index];
            this.pageColor = scheme.border; // darker = page bg
            this.formColor = scheme.bg; // lighter = form bg
            this.fontColor = scheme.fontColor || '#2C3345';
        },
        selectFont(font) {
            this.fontFamily = font;
            loadGoogleFont(font);
            this.emitColorChange();
        },
        emitColorChange() {
            this.$emit('color-change', {
                formColor: this.formColor,
                pageColor: this.pageColor,
                fontColor: this.fontColor,
                inputBgColor: this.inputBackground,
                pageBgImage: this.pageBgImage,
                formBgImage: this.formBgImage,
                fontFamily: this.fontFamily,
            });
        },
        handlePageImageUpload(event) {
            const file = event.target.files?.[0];
            if (!file)
                return;
            this.pageBgImageName = file.name;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.pageBgImage = ev.target.result;
                this.emitColorChange();
            };
            reader.readAsDataURL(file);
        },
        handleFormImageUpload(event) {
            const file = event.target.files?.[0];
            if (!file)
                return;
            this.formBgImageName = file.name;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.formBgImage = ev.target.result;
                this.emitColorChange();
            };
            reader.readAsDataURL(file);
        },
        removePageImage() {
            this.pageBgImage = 'none';
            this.pageBgImageName = '';
            this.emitColorChange();
        },
        removeFormImage() {
            this.formBgImage = 'none';
            this.formBgImageName = '';
            this.emitColorChange();
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-builder-FormDesignPanel.css"></style>

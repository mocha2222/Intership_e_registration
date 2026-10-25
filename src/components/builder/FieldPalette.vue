<template>
  <transition name="drawer-left">
    <div v-if="open" class="form-elements-modal" @click.self="closeModal">
      <div class="form-elements-panel">
      
      <div class="form-elements-header d-flex align-items-center justify-content-between">
        <h5 class="mb-0">Form Elements</h5>
        <button class="btn-close-modal" @click="closeModal">
          <i class="bi bi-x"></i>
        </button>
      </div>

      <div class="form-elements-list-wrapper">
        
        <div>
          <div class="elements-category-label">BASIC</div>
          <div class="elements-category">
            <div
              v-for="(element, index) in basicElements"
              :key="index"
              class="element-item"
              @click="selectElement(element)"
            >
              <div class="element-icon">
                <i :class="element.icon"></i>
              </div>
              <div class="element-label">{{ $label(element.labelKey) || element.name }}</div>
            </div>
          </div>
        </div>
          <div class="elements-category-label">BASIC FORM ELEMENTS</div>
          <div class="elements-category">
            <div
              v-for="(element, index) in basicElementsExtra"
              :key="'extra-' + index"
              class="element-item"
              @click="selectElement(element)"
            >
              <div class="element-icon">
                <i :class="element.icon"></i>
              </div>
              <div class="element-label">{{ $label(element.labelKey) || element.name }}</div>
            </div>
          </div>
      </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
    name: 'FormElement',
    props: {
        open: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            basicElements: [
                { name: 'Logo Banner', labelKey: 'elements.logoBanner', icon: 'bi bi-card-image' },
                { name: 'Heading', labelKey: 'elements.heading', icon: 'bi bi-type-h1' },
                { name: 'Full Name', labelKey: 'elements.fullName', icon: 'bi bi-person-fill' },
                { name: 'Email', labelKey: 'elements.email', icon: 'bi bi-envelope-fill' },
                { name: 'Address', labelKey: 'elements.address', icon: 'bi bi-geo-alt-fill' },
                { name: 'Phone', labelKey: 'elements.phone', icon: 'bi bi-telephone-fill' },
                { name: 'Date', labelKey: 'elements.date', icon: 'bi bi-calendar-event' },
                { name: 'Short Text', labelKey: 'elements.shortText', icon: 'bi bi-file-text' },
                { name: 'Long Text', labelKey: 'elements.longText', icon: 'bi bi-file-text' },
                { name: 'Paragraph', labelKey: 'elements.paragraph', icon: 'bi bi-type' },
                { name: 'Dropdown', labelKey: 'elements.dropdown', icon: 'bi bi-caret-down-fill' },
                { name: 'Single Choice', labelKey: 'elements.singleChoice', icon: 'bi bi-circle-fill' },
                { name: 'Multiple Choice', labelKey: 'elements.multipleChoice', icon: 'bi bi-check-square-fill' },
                { name: 'Number', labelKey: 'elements.number', icon: 'bi bi-123' },
              ],
              basicElementsExtra: [
                { name: 'Image', labelKey: 'elements.image', icon: 'bi bi-image' },
                { name: 'File Upload', labelKey: 'elements.fileUpload', icon: 'bi bi-cloud-arrow-up' },
                { name: 'Input Table', labelKey: 'elements.inputTable', icon: 'bi bi-table' },
                { name: 'Star Rating', labelKey: 'elements.starRating', icon: 'bi bi-star-fill' },
                { name: 'Scale Rating', labelKey: 'elements.scaleRating', icon: 'bi bi-bar-chart-fill' },
            ],
        };
    },
    methods: {
        selectElement(element) {
            this.$emit('select-element', element);
        },
        closeModal() {
            this.$emit('close');
        },
    },
    watch: {
        open: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    document.body.style.overflow = 'hidden';
                }
                else {
                    document.body.style.overflow = '';
                }
            }
        }
    },
    beforeUnmount() {
        document.body.style.overflow = '';
    }
};
</script>

<style scoped src="@/assets/styles/components-builder-FieldPalette.css"></style>

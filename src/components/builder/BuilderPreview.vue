<template>
  <div class="preview-overlay" @click.self="$emit('close')">
    <div class="preview-container">
      <div class="preview-topbar d-flex align-items-center justify-content-between px-3">
        <span class="preview-title fw-bold">{{ $label('editor.previewTitle', { title: formTitle }) }}</span>
        <div class="d-flex align-items-center gap-2">
          <button class="preview-device-btn" :class="{ active: previewDevice === 'phone' }" @click="previewDevice = 'phone'" title="Phone"><i class="bi bi-phone"></i></button>
          <button class="preview-device-btn" :class="{ active: previewDevice === 'tablet' }" @click="previewDevice = 'tablet'" title="iPad"><i class="bi bi-tablet"></i></button>
          <button class="preview-device-btn" :class="{ active: previewDevice === 'laptop' }" @click="previewDevice = 'laptop'" title="Laptop"><i class="bi bi-laptop"></i></button>
        </div>
        <button class="preview-close-btn" @click="$emit('close')"><i class="bi bi-x-lg"></i></button>
      </div>

      <div class="preview-body" :style="pageContainerStyle">
        <div class="preview-frame" :style="previewFrameStyle">
          <div class="preview-form-card fill-form-card" :style="formStyle">
            <div class="preview-form-title-block fill-card-header" :class="{ 'has-banner-header': logoBannerElement }">
              <div v-if="logoBannerElement" class="form-banner-header" :style="logoBannerStyle">
                <img
                  :src="$resolveImg(logoBannerElement.settings?.imageUrl || logoBannerElement.settings?.url)"
                  alt="Banner"
                  :style="{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${typeof logoBannerElement.settings?.panX === 'number' && Math.abs(logoBannerElement.settings.panX) <= 100 ? logoBannerElement.settings.panX : 50}% ${typeof logoBannerElement.settings?.panY === 'number' && Math.abs(logoBannerElement.settings?.panY) <= 100 ? logoBannerElement.settings.panY : 50}%`, display: 'block' }"
                />
              </div>
              <h2 v-else style="font-size:22px; font-weight:700; margin:0;">{{ formTitle }}</h2>
            </div>

            <div class="preview-form-content fill-form-content" :style="{ '--input-bg': inputBgColor }">
              <div v-if="pages[currentPreviewPage]" class="preview-page">
                <div v-for="el in pages[currentPreviewPage].elements" :key="el.id" class="fill-field">
                  <FieldRenderer
                    :el="el"
                    :answers="previewAnswers"
                    mode="public"
                    :viewing-answers="true"
                    :has-error="false"
                  />
                </div>
              </div>

              <div class="preview-footer d-flex justify-content-between align-items-center mt-4 border-top pt-3">
                <div class="d-flex gap-2">
                  <button v-if="currentPreviewPage > 0" class="btn btn-outline-secondary btn-sm px-3" @click="currentPreviewPage--">Back</button>
                  <button v-if="currentPreviewPage < pages.length - 1" class="btn btn-primary btn-sm px-4" @click="currentPreviewPage++">Next Page</button>
                </div>
                <button v-if="currentPreviewPage === pages.length - 1" class="btn btn-success btn-sm px-4" disabled>Submit</button>
                <span class="text-muted" style="font-size:11px;">{{ $label('editor.pageIndicator', { current: currentPreviewPage + 1, total: pages.length }) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FieldRenderer from '@/components/fields/FieldRenderer.vue';

export default {
    components: { FieldRenderer },
    props: {
        formTitle: String,
        pageContainerStyle: Object,
        formStyle: Object,
        logoBannerElement: Object,
        logoBannerStyle: Object,
        inputBgColor: String,
        pages: { type: Array, required: true },
    },
    emits: ['close'],
    data() {
        return {
            previewDevice: 'laptop',
            currentPreviewPage: 0,
            previewAnswers: {},
        };
    },
    computed: {
        previewFrameStyle() {
            const widths = { phone: '375px', tablet: '768px', laptop: '1024px' };
            return { width: widths[this.previewDevice] || '1024px', maxWidth: '100%' };
        },
    },
};
</script>

<style scoped src="@/assets/styles/views-FormPage.css"></style>
<style scoped src="@/assets/styles/views-PublicFillForm.css"></style>

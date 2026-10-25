<template>
  <div class="access-page" :style="pageStyle">

    <div v-if="loading" class="access-center-card">
      <div class="access-spinner"></div>
      <p>Loading Form...</p>
    </div>

    <div v-else-if="error" class="access-center-card">
      <div class="access-error-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
      <h2>Form not found</h2>
      <p>This form may have been deleted, isn't published, or the link is invalid.</p>
    </div>

    <div v-else class="access-body">
      <div class="access-choice-card" :style="formStyle">
        
        <div v-if="logoUrls.length" class="access-logo-wrapper">
          <img
            v-for="(logo, index) in logoUrls"
            :key="`${index}-${logo}`"
            :src="$resolveImg(logo)"
            alt="Logo"
            class="access-form-logo"
          />
        </div>

        <h1 class="access-form-title">{{ formData.title }}</h1>
        <p v-if="formData.description" class="access-form-desc">{{ formData.description }}</p>

        <div class="access-divider"></div>

        <p class="access-prompt">What would you like to do?</p>

        <div class="access-actions">
          <button class="access-btn access-btn-primary" @click="goToForm">
            <i class="bi bi-pencil-square me-2"></i>
            Fill Form
          </button>
          <button class="access-btn access-btn-secondary" @click="goToMaterials">
            <i class="bi bi-download me-2"></i>
            Download Materials
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getPublicForm } from '@/api/formsApi';
import { resolveImageUrl } from '@/api/http';
import Header from '@/components/common/AppHeader.vue';
import { loadGoogleFont, normalizeFontFamily } from '@/utils/fontLoader';
import { apiPublicFormToViewModel } from '@/utils/mapper';
export default {
    name: 'FormAccessChoice',
    components: {
        Header
    },
    data() {
        return {
            formId: this.$route.params.id,
            formData: null,
            loading: true,
            error: false,
        };
    },
    computed: {
        logoUrls() {
            return this.parseLogoUrls(this.formData?.logoUrl);
        },
        pageStyle() {
            if (!this.formData?.design)
                return {};
            const d = this.formData.design;
            const style = {};
            if (d.pageBgColor)
                style.backgroundColor = d.pageBgColor;
            if (d.pageBgImage && d.pageBgImage !== 'none') {
                style.backgroundImage = `url(${resolveImageUrl(d.pageBgImage)})`;
                style.backgroundSize = 'cover';
                style.backgroundPosition = 'center';
                style.backgroundAttachment = 'fixed';
            }
            if (d.fontColor)
                style.color = d.fontColor;
            style.fontFamily = `"${normalizeFontFamily(d.fontFamily || 'Inter')}", sans-serif`;
            return style;
        },
        formStyle() {
            if (!this.formData?.design)
                return {};
            const d = this.formData.design;
            const style = {};
            if (d.formBgColor)
                style.backgroundColor = d.formBgColor;
            if (d.formBgImage && d.formBgImage !== 'none') {
                style.backgroundImage = `url(${resolveImageUrl(d.formBgImage)})`;
                style.backgroundSize = 'cover';
                style.backgroundPosition = 'center';
            }
            return style;
        },
    },
    async mounted() {
        try {
            this.loading = true;
            const sf = apiPublicFormToViewModel(await getPublicForm(this.formId));
            this.formData = sf;
            loadGoogleFont(sf.design?.fontFamily || 'Inter');
        }
        catch (e) {
            console.error('Failed to load form:', e);
            this.error = true;
        }
        finally {
            this.loading = false;
        }
    },
    methods: {
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
                catch (e) {
                    // Fall back to the legacy single-logo value.
                }
            }
            return [value];
        },
        goToForm() {
            this.$router.push({ name: 'formFill', params: { id: this.formId }, query: { direct: '1' } });
        },
        goToMaterials() {
            this.$router.push({ name: 'formMaterials', params: { id: this.formId } });
        },
    },
};
</script>

<style scoped src="@/assets/styles/views-FormAccessChoice.css"></style>

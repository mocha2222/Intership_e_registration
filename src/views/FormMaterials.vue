<template>
  <div class="materials-page" :style="pageStyle">
    
    <div class="fill-header-spacer"></div>

    <div v-if="loading" class="mat-center">
      <div class="mat-spinner"></div>
      <p>Loading Form...</p>
    </div>

    <div v-else class="mat-body">
      <div class="mat-card" :style="formStyle">
        
        <button class="mat-back-btn" @click="goBack">
          <i class="bi bi-arrow-left me-1"></i> Back
        </button>

        <h1 class="mat-title">
          <i class="bi bi-folder2-open me-2"></i>
          Workshop Materials
        </h1>
        <p class="mat-subtitle">{{ formTitle }}</p>

        <div v-if="materials.length === 0" class="mat-empty">
          <i class="bi bi-inbox"></i>
          <p>No materials available.</p>
        </div>

        <div v-else class="mat-grid">
          <div v-for="mat in materials" :key="mat.id" class="mat-file-card">
            <div class="mat-file-icon">
              <i :class="getFileIcon(mat.mimeType)"></i>
            </div>
            <div class="mat-file-info">
              <span class="mat-file-name" :title="mat.originalName">{{ mat.originalName }}</span>
              <span class="mat-file-size">{{ formatSize(mat.size) }}</span>
            </div>
            <div class="mat-file-actions">
              <button class="mat-action-btn mat-dl-btn" @click="downloadFile(mat)" title="Download">
                <i class="bi bi-download"></i>
                <span class="mat-action-label">Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getPublicForm } from '@/api/formsApi';
import { API_BASE_URL, resolveImageUrl } from '@/api/http';
import Header from '@/components/common/AppHeader.vue';
import { loadGoogleFont, normalizeFontFamily } from '@/utils/fontLoader';
import { apiPublicFormToViewModel } from '@/utils/mapper';
import { fetchMaterials } from '@/store/materialStore';
export default {
    name: 'FormMaterials',
    components: {
        Header
    },
    data() {
        return {
            formId: this.$route.params.id,
            formData: null,
            formTitle: '',
            materials: [],
            loading: true,
        };
    },
    computed: {
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
        baseUrl() {
            return API_BASE_URL.replace(/\/api\/?$/, '');
        },
    },
    async mounted() {
        try {
            const [rawForm, mats] = await Promise.all([
                getPublicForm(this.formId),
                fetchMaterials(this.formId),
            ]);
            const sf = apiPublicFormToViewModel(rawForm);
            this.formData = sf;
            loadGoogleFont(sf.design?.fontFamily || 'Inter');
            this.formTitle = sf.title;
            this.materials = mats || [];
        }
        catch (e) {
            console.error('Failed to load materials:', e);
        }
        finally {
            this.loading = false;
        }
    },
    methods: {
        goBack() {
            this.$router.push({ name: 'formAccessChoice', params: { id: this.formId } });
        },
        getFileUrl(mat) {
            return `${this.baseUrl}/uploads/${mat.formId || this.formId}/materials/${mat.storedFilename}`;
        },
        viewFile(mat) {
            window.open(this.getFileUrl(mat), '_blank');
        },
        downloadFile(mat) {
            const a = document.createElement('a');
            a.href = this.getFileUrl(mat);
            a.download = mat.originalName;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },
        formatSize(bytes) {
            if (!bytes)
                return '0 B';
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            let size = bytes;
            while (size >= 1024 && i < units.length - 1) {
                size /= 1024;
                i++;
            }
            return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
        },
        getFileIcon(mimeType) {
            if (!mimeType)
                return 'bi bi-file-earmark';
            if (mimeType === 'application/pdf')
                return 'bi bi-file-earmark-pdf-fill';
            if (mimeType.startsWith('image/'))
                return 'bi bi-file-earmark-image-fill';
            if (mimeType.includes('word') || mimeType.includes('document'))
                return 'bi bi-file-earmark-word-fill';
            if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
                return 'bi bi-file-earmark-excel-fill';
            if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
                return 'bi bi-file-earmark-ppt-fill';
            return 'bi bi-file-earmark-fill';
        },
    },
};
</script>

<style scoped src="@/assets/styles/views-FormMaterials.css"></style>

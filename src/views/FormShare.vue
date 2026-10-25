<template>
  <div class="public-share-page">
    <Header />
    <div class="sub-header-spacer"></div>
    <FormEditorSubheader
      :formTitle="formTitle"
      activeTabProp="PUBLISH"
      @tab-changed="handleTabChange"
    />

    <div class="share-main">
      <div class="share-header-wrapper">
        <div class="page-top-header">
          <div class="page-header-icon-wrap">
            <i class="bi bi-gear-fill"></i>
          </div>
          <div class="page-header-text">
            <h1 class="page-header-title">Share Your Form</h1>
            <p class="page-header-sub">Your form is live and ready to receive responses</p>
          </div>
        </div>
      </div>

      <div class="share-card">
        
        <div class="settings-section">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h2 class="section-title">SHARE WITH LINK</h2>

            <button class="btn-publish-status" @click="openAccessSettings">
              <i class="bi bi-shield-lock-fill"></i>
              Setting
            </button>
          </div>
          <p class="section-desc">Anyone with this link can fill out and submit your form</p>

          <div class="link-box-v2 d-flex align-items-center mb-3">
            <i class="bi bi-link-45deg me-2 link-icon-blue"></i>
            <span class="link-url">{{ shareUrl }}</span>
          </div>

          <div class="d-flex justify-content-end gap-3">
            <button class="btn-jf btn-copy-light" @click="copyLink">
              <i class="bi bi-files me-2"></i>
              {{ copied ? 'Copied!' : 'COPY LINK' }}
            </button>
            <button class="btn-jf btn-open-dark" @click="openInNewTab">
              <i class="bi bi-send-fill me-2"></i>
              OPEN FORM
            </button>
          </div>
        </div>

        <div class="section-divider"></div>

        <div class="settings-section">
          <h2 class="section-title">Form Status</h2>
          <p class="section-desc">Enable, disable, or conditionally enable your form</p>

          <div class="qr-status-layout mt-4">
            <div class="qr-side">
              <div class="qr-container-v2">
                <canvas ref="qrCanvas"></canvas>
              </div>
            </div>

            <div class="qr-info-side">
              <h3 class="qr-side-label">Link</h3>
              <div class="link-box-v2 d-flex align-items-center mb-2">
                <i class="bi bi-link-45deg me-2 link-icon-blue"></i>
                <span class="link-url text-truncate">{{ shareUrl }}</span>
              </div>
              <p class="qr-side-sub">Share this link or QR code with anyone.</p>

              <div class="d-flex justify-content-end gap-3 mt-4">
                <button class="btn-jf btn-copy-light" @click="copyLink">
                  <i class="bi bi-files me-2"></i>
                  {{ copied ? 'Copied!' : 'COPY LINK' }}
                </button>
                <button class="btn-jf btn-open-dark" @click="downloadQr" :disabled="isDownloading">
                  <span v-if="isDownloading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  <i v-else class="bi bi-download me-2"></i>
                  {{ isDownloading ? ('Processing...') : 'DOWNLOAD QR' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AccessSettingsModal
      :visible="showAccessModal"
      :initial-permission="permissionMode"
      @close="showAccessModal = false"
      @save="onAccessSave"
    />

    <div ref="qrDownloadContainer" class="qr-download-capture">
      <div class="qr-capture-content" :style="pageStyle">
        <div class="qr-capture-inner" :style="formStyle">
          <div v-if="logoUrls.length" class="qr-capture-logo">
            <img v-for="(logo, index) in logoUrls" :key="`${index}-${logo}`" :src="$resolveImg(logo)" alt="Logo" crossorigin="anonymous" />
          </div>
          <h2 class="qr-capture-title" :style="{ color: storeForm?.design?.fontColor || '#1a2547' }">{{ formTitle }}</h2>
          <div class="qr-capture-image">
            <img :src="qrDataUrl" alt="QR" />
          </div>
          <p class="qr-capture-hint" :style="{ color: storeForm?.design?.fontColor ? storeForm.design.fontColor : '#64748b' }">
            Scan this code to open your form on mobile
          </p>
          <div class="qr-capture-footer">
            DEBC Event Management
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '@/components/common/AppHeader.vue';
import FormEditorSubheader from '@/components/builder/BuilderToolbar.vue';
import AccessSettingsModal from '@/components/builder/PermissionModal.vue';
import { getForm, saveForm } from '@/store/formStore';
import { getMyForm } from '@/api/formsApi';
import { apiFormToStore } from '@/utils/mapper';
import { resolveImageUrl } from '@/api/http';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
export default {
    name: 'PublicShare',
    components: { Header, FormEditorSubheader, AccessSettingsModal },
    data() {
        return {
            formId: this.$route.params.id || 'demo123',
            storeForm: null,
            formTitle: 'Loading...',
            customSlug: '',
            showAccessModal: false,
            permissionMode: 'submit_and_view',
            copied: false,
            qrDataUrl: '',
            isDownloading: false,
        };
    },
    computed: {
        shareUrl() {
            // Point to the public fill route
            const base = window.location.origin;
            const token = this.storeForm?.shareToken || this.formId;
            return `${base}/form/${token}/fill`;
        },
        logoUrls() {
            return this.parseLogoUrls(this.storeForm?.logoUrl);
        },
        pageStyle() {
            if (!this.storeForm?.design)
                return {};
            const d = this.storeForm.design;
            const style = {};
            if (d.pageBgColor)
                style.backgroundColor = d.pageBgColor;
            if (d.pageBgImage && d.pageBgImage !== 'none') {
                style.backgroundImage = `url(${resolveImageUrl(d.pageBgImage)})`;
                style.backgroundSize = 'cover';
                style.backgroundPosition = 'center';
                style.backgroundAttachment = 'fixed';
            }
            return style;
        },
        formStyle() {
            if (!this.storeForm?.design)
                return {};
            const d = this.storeForm.design;
            const style = {};
            if (d.formBgColor)
                style.backgroundColor = d.formBgColor;
            if (d.formBgImage && d.formBgImage !== 'none') {
                style.backgroundImage = `url(${resolveImageUrl(d.formBgImage)})`;
                style.backgroundSize = 'cover';
                style.backgroundPosition = 'center';
            }
            return style;
        }
    },
    async mounted() {
        this.customSlug = this.formId;
        if (this.formId !== 'demo123') {
            try {
                let sf = getForm(String(this.formId));
                if (!sf)
                    sf = apiFormToStore(await getMyForm(this.formId));
                this.storeForm = sf;
                this.formTitle = sf.title;
                this.permissionMode = sf.settings?.permissionMode || 'submit_and_view';
            }
            catch (err) {
                if (err.status === 403 || err.status === 404) {
                    alert("You don't have permission to edit this form, or it doesn't exist.");
                    this.$router.push('/home');
                }
                else {
                    alert("Failed to load form settings.");
                    this.$router.push('/home');
                }
                return;
            }
        }
        this.$nextTick(() => this.renderQr());
    },
    watch: {
        shareUrl() { this.renderQr(); }
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
                    // Fall through to legacy single-logo handling.
                }
            }
            return [value];
        },
        handleTabChange(tab) {
            const id = this.$route.params.id;
            if (!id)
                return;
            if (tab === 'BUILD')
                this.$router.push({ name: 'formEditor', params: { id } });
            else if (tab === 'SETTINGS')
                this.$router.push({ name: 'formSettings', params: { id } });
            else if (tab === 'PUBLISH')
                this.$router.push({ name: 'FormShare', params: { id } });
        },
        openAccessSettings() {
            this.showAccessModal = true;
        },
        copyLink() {
            const text = this.shareUrl;
            const success = () => {
                this.copied = true;
                setTimeout(() => { this.copied = false; }, 2000);
            };
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(success);
            }
            else {
                const el = document.createElement('textarea');
                el.value = text;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                success();
            }
        },
        openInNewTab() {
            window.open(this.shareUrl, '_blank');
        },
        async renderQr() {
            const canvas = this.$refs.qrCanvas;
            if (!canvas)
                return;
            await QRCode.toCanvas(canvas, this.shareUrl, {
                errorCorrectionLevel: 'H',
                width: 220,
                margin: 4,
                color: { dark: '#1a2547', light: '#ffffff' },
            });
            this.qrDataUrl = canvas.toDataURL('image/png');
        },
        async downloadQr() {
            if (!this.$refs.qrDownloadContainer)
                return;
            this.isDownloading = true;
            try {
                const element = this.$refs.qrDownloadContainer;
                element.style.display = 'block';
                element.style.position = 'fixed';
                element.style.top = '0';
                element.style.left = '-9999px';
                const canvas = await html2canvas(element, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: null,
                    logging: false
                });
                element.style.display = 'none';
                const fileName = this.formTitle ? this.formTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'form';
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}-qr.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
            catch (err) {
                console.error('QR capture failed:', err);
            }
            finally {
                this.isDownloading = false;
            }
        },
        onAccessSave(payload) {
            this.permissionMode = payload.permissionMode;
            if (this.storeForm) {
                if (!this.storeForm.settings) this.storeForm.settings = { permissionMode: 'submit_and_view', materialUploadEnabled: false, submissionStartTime: null, submissionEndTime: null, expirationAt: null, submissionLimit: null };
                this.storeForm.settings.permissionMode = payload.permissionMode;
                saveForm(this.storeForm).catch(error => alert(error.message || 'Could not save permissions.'));
            }
            this.showAccessModal = false;
        }
    }
};
</script>

<style scoped src="@/assets/styles/views-FormShare.css"></style>

<template>
  <div class="fill-page" :style="pageStyle">
    <div v-if="loading" class="fill-not-found">
      <h2>Loading form...</h2>
    </div>

    <div v-else-if="error || !formData" class="fill-not-found">
      <h2>Form not found</h2>
      <p>This form may have been deleted or the link is invalid.</p>
    </div>

    <div v-else-if="submitted && !viewingAnswers" class="fill-thank-you">
      <div class="thank-you-card" :style="formStyle">
        <button v-if="hasMaterials" class="fill-back-to-access" :style="{ fontFamily: formStyle.fontFamily }" @click="goToAccessChoice">
          <i class="bi bi-arrow-left me-1"></i> Back
        </button>
        <div class="thank-you-icon"><i class="bi bi-check-circle-fill"></i></div>
        <h2>Thank You!</h2>
        <p>Your response has been submitted successfully.</p>

        <AttendanceQRSection
          :qrImageUrl="qrImageUrl"
          :formData="formData"
          :pageStyle="pageStyle"
          :formStyle="formStyle"
          :submitting="submitting"
        />

        <div v-if="formData?.settings?.permissionMode === 'submit_and_view'" class="d-flex flex-column gap-3 mt-4">
          <button class="btn-view-answers" @click="viewingAnswers = true">View Answers</button>
        </div>
      </div>
    </div>

    <div v-else-if="isClosed" class="fill-not-found">
      <div class="closed-icon"><i class="bi bi-clock-history"></i></div>
      <h2>Form Closed</h2>
      <p>{{ closedReason }}</p>
    </div>

    <div v-else class="fill-body">
      <div v-if="logoUrls.length" class="fill-logo-outer">
        <img v-for="(logo, index) in logoUrls" :key="`${index}-${logo}`" :src="$resolveImg(logo)" alt="Logo" class="fill-form-logo" />
      </div>

      <div
        v-if="formData.pages.length > 1"
        class="fill-page-indicator"
        :style="{ fontFamily: formStyle.fontFamily }"
      >
        {{ $label('form.pageIndicator', { current: currentPage + 1, total: formData.pages.length }) }}
      </div>

      <div v-if="formData.pages[currentPage]" class="fill-form-card" :style="formStyle">
        <div :key="currentPage">
          
          <div class="fill-card-header" :class="{ 'has-banner-header': logoBannerElement }">
            
            <div v-if="logoBannerElement" class="fill-form-banner" :style="logoBannerStyle">
              <img
                :src="$resolveImg(logoBannerElement.settings?.imageUrl || logoBannerElement.settings?.url)"
                alt="Banner"
                :style="{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: `${typeof logoBannerElement.settings?.panX === 'number' && Math.abs(logoBannerElement.settings?.panX) <= 100 ? logoBannerElement.settings.panX : 50}% ${typeof logoBannerElement.settings?.panY === 'number' && Math.abs(logoBannerElement.settings?.panY) <= 100 ? logoBannerElement.settings.panY : 50}%`,
                  display: 'block'
                }"
              />
            </div>
            <h2 v-else class="fill-form-title">{{ formData.title }}</h2>
          </div>

        <div v-if="serverError" class="fill-validation-banner mt-0">
          <div class="validation-banner-content">
            <i class="bi bi-x-circle-fill"></i>
            <div>
              <strong>Submission Failed</strong>
              <p class="mb-0 small">{{ serverError }}</p>
            </div>
          </div>
        </div>

        <div v-if="validationErrors.length > 0" class="fill-validation-banner">
          <div class="validation-banner-content">
            <i class="bi bi-exclamation-circle-fill"></i>
            <div>
              <strong>Please complete all required fields:</strong>
              <ul class="validation-errors-list">
                <li v-for="(error, idx) in validationErrors" :key="idx">{{ error }}</li>
              </ul>
            </div>
          </div>
        </div>

        <fieldset v-if="hasVisibleElements" :disabled="viewingAnswers" class="fill-form-content" :style="{ '--input-bg': inputBgColor }" style="border: none; margin: 0;">
          <template v-for="el in formData.pages[currentPage].elements" :key="el.id">
            
            <div v-if="el.type !== 'logobanner'" class="fill-field" :class="{ 'has-error': hasFieldError(el.id) }">

              <FieldRenderer
                :el="el"
                :answers="answers"
                :viewing-answers="viewingAnswers"
                :has-error="hasFieldError(el.id)"
                @file-selected="handleFileUpload"
                @remove-file="removeFile"
              />
            </div>
          </template>
        </fieldset>
      </div>
    </div>

    <div class="fill-footer-actions" :style="{ justifyContent: footerJustify }">
      <button v-if="currentPage > 0" class="fill-nav-btn prev" :style="{ fontFamily: formStyle.fontFamily }" @click="prevPage">
        <i class="bi bi-chevron-left me-1"></i> Previous
      </button>
      <button v-else-if="hasMaterials" class="fill-nav-btn prev" :style="{ fontFamily: formStyle.fontFamily }" @click="goToAccessChoice">
        <i class="bi bi-chevron-left me-1"></i> Back
      </button>
      
      <button v-if="currentPage < formData.pages.length - 1" class="fill-nav-btn next" :style="{ fontFamily: formStyle.fontFamily }" @click="handleNextPage" :disabled="isValidatingPage || submitting">
        Next Page <i class="bi bi-chevron-right ms-1"></i>
      </button>
      
      <button v-if="currentPage === formData.pages.length - 1 && !viewingAnswers" class="fill-submit-btn" :style="{ fontFamily: formStyle.fontFamily }" @click="handleSubmitForm" :disabled="isValidatingPage || submitting">
        Submit
      </button>
      
      <button v-if="viewingAnswers" class="fill-nav-btn" :style="{ fontFamily: formStyle.fontFamily }" @click="viewingAnswers = false">
        Back to Thank You Page
      </button>
    </div>
  </div>
</div>
</template>

<script>
import { useDropdownAnswers } from "@/composables/useDropdownAnswers";
import { validatePage } from "@/utils/validators";
import { useFormDraft } from "@/composables/useFormDraft";
import { serializeAnswers } from "@/utils/answerSerializer";
import FieldRenderer from "@/components/fields/FieldRenderer.vue";
import { addSubmission } from '@/store/submissionStore';
import { getPublicForm } from '@/api/formsApi';
import { listMaterials } from '@/api/materialsApi';
import { resolveImageUrl } from '@/api/http';
import QRCode from 'qrcode';
import { loadGoogleFont, normalizeFontFamily } from '@/utils/fontLoader';
import AttendanceQRSection from '@/components/attendance/AttendanceQR.vue';
import { parseApiDatetime } from '@/utils/dates';
import { apiPublicFormToViewModel } from '@/utils/mapper';
export default {
    name: 'PublicFillForm',
    components: {
        FieldRenderer,
        AttendanceQRSection,
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
            else {
                style.backgroundImage = 'none';
            }
            if (d.fontColor)
                style.color = d.fontColor;
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
            else {
                style.backgroundImage = 'none';
            }
            style.fontFamily = `"${normalizeFontFamily(d.fontFamily || 'Inter')}", sans-serif`;
            return style;
        },
        inputBgColor() {
            return this.formData?.design?.inputBgColor || '#FFFFFF';
        },
        footerJustify() {
            const showPrev = this.currentPage > 0 || (this.currentPage === 0 && this.hasMaterials);
            const showNext = this.currentPage < (this.formData?.pages?.length - 1);
            const showSubmit = this.currentPage === (this.formData?.pages?.length - 1) && !this.viewingAnswers;
            const isSinglePage = this.formData?.pages?.length === 1;
            if (showPrev && (showNext || showSubmit))
                return 'space-between';
            if ((showSubmit && isSinglePage) || (this.viewingAnswers && isSinglePage))
                return 'center';
            return 'flex-end';
        },
        logoBannerElement() {
            if (!this.formData?.pages)
                return null;
            for (const page of this.formData.pages) {
                const found = page.elements.find(el => el.type === 'logobanner' && (el.settings?.imageUrl || el.settings?.url));
                if (found)
                    return found;
            }
            return null;
        },
        logoUrls() {
            return this.parseLogoUrls(this.formData?.logoUrl);
        },
        hasVisibleElements() {
            if (!this.formData?.pages?.[this.currentPage])
                return false;
            return this.formData.pages[this.currentPage].elements.some(el => el.type !== 'logobanner');
        },
        logoBannerStyle() {
            const el = this.logoBannerElement;
            if (!el)
                return {};
            const style = {
                width: '100%',
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
    data() {
        return {
            formId: this.$route.params.id,
            formData: null,
            answers: {},
            submitted: false,
            submitting: false,
            viewingAnswers: false,
            currentPage: 0,
            loading: true,
            error: false,
            validationErrors: [],
            errorFieldIds: new Set(),
            isValidatingPage: false,
            qrToken: null,
            qrImageUrl: null,
            isClosed: false,
            closedReason: '',
            serverError: null,
            hasMaterials: false,
        };
    },
    async mounted() {
        try {
            this.loading = true;
            const sf = apiPublicFormToViewModel(await getPublicForm(this.formId));
            this.formData = sf;
            if (sf.design?.fontFamily) {
                loadGoogleFont(sf.design.fontFamily);
            }
            // ── Material check & redirect ──
            // If the form has uploaded materials, check whether to show the access choice page.
            // When ?direct=1 is present, skip the redirect (user chose "fill form")
            // but still mark hasMaterials = true so the back button works.
            if (sf.settings?.materialUploadEnabled) {
                try {
                    const mats = await listMaterials(this.formId);
                    if (mats && mats.length > 0) {
                        this.hasMaterials = true;
                        if (this.$route.query.direct !== '1') {
                            this.$router.replace({ name: 'formAccessChoice', params: { id: this.formId } });
                            return;
                        }
                    }
                }
                catch { /* ignore — proceed to form */ }
            }
            // ── Form Status & Submission Deadline Check Enforced here ──
            const now = new Date();
            let closed = false;
            let reason = '';
            // 1. Hard disable
            if (sf.status === 'disabled') {
                closed = true;
                reason = 'Form Closed';
            }
            // 2. Main Submission Timing (Start/End)
            const submissionStart = parseApiDatetime(sf.settings?.submissionStartTime);
            if (!closed && submissionStart && now < submissionStart) {
                closed = true;
                reason = 'This form is not yet open for submissions.';
            }
            const submissionEnd = parseApiDatetime(sf.settings?.submissionEndTime);
            if (!closed && submissionEnd && now > submissionEnd) {
                closed = true;
                reason = 'This form has reached its submission deadline.';
            }
            // Check 4: Expiration date (with optional time like "12:15 PM")
            if (!closed && ['disable_date', 'disable_both'].includes(sf.status) && (sf.settings?.expirationAt || sf.expirationDate)) {
                const expDate = sf.settings?.expirationAt ? parseApiDatetime(sf.settings.expirationAt) : this.parseExpirationDate(sf.expirationDate, sf.expirationTime);
                if (expDate && now > expDate) {
                    closed = true;
                    reason = 'This form has reached its submission deadline.';
                }
            }
            // Check 5: Submission count has reached the limit
            if (!closed && ['disable_limit', 'disable_both'].includes(sf.status) && sf.settings?.submissionLimit) {
                const currentCount = sf.submissionCount || 0;
                if (currentCount >= sf.settings.submissionLimit) {
                    closed = true;
                    reason = 'This form has reached its maximum number of submissions.' || 'This form has reached its submission limit.';
                }
            }
            this.isClosed = closed;
            this.closedReason = reason;
            const submissionStorage = sf.attendance?.attendanceEnabled ? localStorage : sessionStorage;
            const savedSubmission = submissionStorage.getItem('lastSubmission_' + this.formId);
            if (savedSubmission) {
                try {
                    const parsedSubmission = JSON.parse(savedSubmission);
                    if (!parsedSubmission.responseId)
                        throw new Error("Saved submission has no response ID.");
                    this.answers = parsedSubmission.answers || parsedSubmission;
                    this.qrToken = parsedSubmission.qrToken || null;
                    this.qrImageUrl = parsedSubmission.qrImageUrl || null;
                    this.submitted = true;
                }
                catch (e) { }
            }
            // ── Initialize answers for a new (not yet submitted) form ──
            if (!this.submitted && this.formData) {
                // Set default empty arrays for multiple choice fields
                this.formData.pages.forEach(page => {
                    page.elements.forEach(el => {
                        if (el.type === 'multiplechoice') {
                            this.answers[`el_${el.id}`] = [];
                        }
                    });
                });
                // Restore draft answers from localStorage (auto-saved while user was typing)
                const draft = useFormDraft(this.formId).load();
                if (draft) {
                    try {
                        this.answers = { ...this.answers, ...draft };
                    }
                    catch (e) {
                        console.warn('Failed to parse form draft:', e);
                    }
                }
            }
        }
        catch (e) {
            console.error("Failed to load public form:", e);
            this.error = true;
        }
        finally {
            this.loading = false;
        }
    },
    methods: {
        // Parse a logoUrl value (string, JSON array, or already an array) into an array of URLs
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
                    // Fall through to legacy single-logo handling
                }
            }
            return [value];
        },
        // Parse an expiration date + optional "HH:MM AM/PM" time string into a Date object
        parseExpirationDate(dateStr, timeStr) {
            if (!dateStr)
                return null;
            if (!timeStr)
                return parseApiDatetime(`${dateStr}T23:59:59`);
            // Try to parse "12:15 PM" format into 24-hour time
            const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (!match)
                return parseApiDatetime(`${dateStr}T23:59:59`);
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const period = match[3].toUpperCase();
            if (period === 'PM' && hours !== 12)
                hours += 12;
            if (period === 'AM' && hours === 12)
                hours = 0;
            const hh = String(hours).padStart(2, '0');
            const mm = String(minutes).padStart(2, '0');
            return parseApiDatetime(`${dateStr}T${hh}:${mm}:00`);
        },
        // Check if a specific field has a validation error
        hasFieldError(elId) {
            return this.errorFieldIds.has(elId);
        },
        // Get the label for a field or fallback to its type
        getFieldLabel(element) {
            return element.label || element.type;
        },
        // Validate all fields on the current page
        validateCurrentPage() {
            const elements = this.formData?.pages[this.currentPage]?.elements || [];
            const result = validatePage(elements, this.answers, (field) => this.isDropdownTreeIncomplete(field));
            this.validationErrors = result.errors;
            this.errorFieldIds = result.fieldIds;
            return result.errors.length === 0;
        },
        // Handle moving to the next page after validating the current page
        handleNextPage() {
            if (this.validateCurrentPage()) {
                this.nextPage();
            }
            else {
                window.scrollTo(0, 0);
            }
        },
        // Handle form submission click
        handleSubmitForm() {
            if (this.submitting || this.submitted)
                return;
            const lastPage = this.currentPage;
            for (let page = 0; page < this.formData.pages.length; page++) {
                this.currentPage = page;
                if (!this.validateCurrentPage())
                    return;
            }
            this.currentPage = lastPage;
            this.submitForm();
        },
        // Navigate to the next page
        nextPage() {
            if (this.currentPage < this.formData.pages.length - 1) {
                this.currentPage++;
                window.scrollTo(0, 0);
            }
        },
        // Navigate to the previous page
        prevPage() {
            if (this.currentPage > 0) {
                this.currentPage--;
                window.scrollTo(0, 0);
            }
        },
        // Reset the form state and answers
        resetForm() {
            this.submitted = false;
            this.currentPage = 0;
            this.answers = {};
            this.qrToken = null;
            this.qrImageUrl = null;
            sessionStorage.removeItem('lastSubmission_' + this.formId);
            localStorage.removeItem('lastSubmission_' + this.formId);
            localStorage.removeItem('attendanceQR_' + this.formId);
            if (this.formData) {
                this.formData.pages.forEach(p => {
                    p.elements.forEach(el => {
                        if (el.type === 'multiplechoice') {
                            this.answers[`el_${el.id}`] = [];
                        }
                    });
                });
            }
            window.scrollTo(0, 0);
        },
        // Handle file uploads and store all selected files as base64 representations
        async handleFileUpload(event, elId) {
            const files = Array.from(event.target.files || []);
            if (!files.length)
                return;
            const uploadedFiles = await Promise.all(files.map(file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ name: file.name, data: reader.result });
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
            })));
            const existingData = this.answers[`el_${elId}`];
            const existingNames = this.answers[`el_${elId}_name`];
            const previousData = Array.isArray(existingData) ? existingData : existingData ? [existingData] : [];
            const previousNames = Array.isArray(existingNames) ? existingNames : existingNames ? [existingNames] : [];
            this.answers[`el_${elId}`] = [
                ...previousData,
                ...uploadedFiles.map(file => file.data),
            ];
            this.answers[`el_${elId}_name`] = [
                ...previousNames,
                ...uploadedFiles.map(file => file.name),
            ];
        },
        removeFile(index, elId) {
            const data = this.answers[`el_${elId}`];
            const names = this.answers[`el_${elId}_name`];
            const files = Array.isArray(data) ? [...data] : data ? [data] : [];
            const fileNames = Array.isArray(names) ? [...names] : names ? [names] : [];
            files.splice(index, 1);
            fileNames.splice(index, 1);
            if (files.length) {
                this.answers[`el_${elId}`] = files;
                this.answers[`el_${elId}_name`] = fileNames;
            }
            else {
                delete this.answers[`el_${elId}`];
                delete this.answers[`el_${elId}_name`];
            }
        },
        // Check if the dropdown tree is missing any required levels or filltext values
        isDropdownTreeIncomplete(...args) {
            return useDropdownAnswers(this.answers).isDropdownTreeIncomplete(...args);
        },
        // Get final display text for the entire dropdown tree response
        getDropdownResponseValue(...args) {
            return useDropdownAnswers(this.answers).getDropdownResponseValue(...args);
        },
        // Compile answers and submit the form to the backend
        async submitForm() {
            if (this.submitting || this.submitted)
                return;
            const formData = serializeAnswers(this.formData, this.answers, (field) => this.getDropdownResponseValue(field));
            this.submitting = true;
            this.serverError = null;
            try {
                const result = await addSubmission(this.formId, formData);
                this.submitted = true;
                // If backend returns a token for attendance tracking, create the QR code image
                if (result?.qrToken && this.formData?.attendance?.attendanceEnabled) {
                    this.qrToken = result.qrToken;
                    try {
                    this.qrImageUrl = await QRCode.toDataURL(result.qrToken, {
                        width: 280,
                        margin: 4,
                        color: { dark: '#1a2547', light: '#ffffff' },
                    });
                } catch (error) {
                    console.warn('Response saved, but QR image generation failed:', error);
                    this.qrImageUrl = null;
                }
                    try {
                        localStorage.setItem('attendanceQR_' + this.formId, this.qrImageUrl);
                    }
                    catch { }
                }
                this.submitted = true;
                try {
                    const submissionStorage = this.formData?.attendance?.attendanceEnabled
                        ? localStorage
                        : sessionStorage;
                    submissionStorage.setItem('lastSubmission_' + this.formId, JSON.stringify({
                        responseId: result.id,
                        answers: this.answers,
                        qrToken: this.qrToken,
                        qrImageUrl: this.qrImageUrl,
                    }));
                }
                catch { }
                try {
                    useFormDraft(this.formId).clear();
                }
                catch { }
            }
            catch (e) {
                console.error('Submission error:', e);
                this.serverError = e.message || 'An unexpected error occurred during submission. Please check your connection.';
                window.scrollTo(0, 0);
            }
            finally {
                this.submitting = false;
            }
        },
        // Redirect back to access choice screen
        goToAccessChoice() {
            this.$router.push({ name: 'formAccessChoice', params: { id: this.formId } });
        },
    },
    watch: {
        answers: {
            deep: true,
            handler(newAnswers) {
                if (!this.submitted && this.formData) {
                    try {
                        useFormDraft(this.formId).save(newAnswers);
                    }
                    catch (e) { }
                }
            }
        }
    },
};
</script>

<style scoped src="@/assets/styles/views-PublicFillForm.css"></style>

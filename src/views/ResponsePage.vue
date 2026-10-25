<template>
  <div class="responses-page">
    
    <Header />

    <ResponsesTable
      :columns="columns"
      :submissions="submissions"
      :formId="formId"
      :formTitle="formTitle"
      :attendanceEnabled="attendanceEnabled"
      @delete-submission="handleDeleteSubmission"
    />
  </div>
</template>

<script>
import Header from '@/components/common/AppHeader.vue';
import ResponsesTable from '@/components/responses/ResponseTable.vue';
import { store } from '@/store/store';
import { fetchSubmissionsFromApi, deleteSubmission, getSubmissions } from '@/store/submissionStore';
import { getMyForm } from '@/api/formsApi';
const SKIP_TYPES = new Set(['heading', 'logobanner']);
export default {
    name: 'ResponsesPage',
    components: { Header, ResponsesTable },
    data() {
        return {
            formId: this.$route.params.id || 'default',
            formTitle: 'Loading...',
            columns: [],
            lastUpdated: 'recently',
            pollInterval: null,
            attendanceEnabled: false,
        };
    },
    async mounted() {
        if (this.formId === 'default')
            return;
        try {
            const sf = await getMyForm(this.formId);
            this.formTitle = sf.title;
            // Format layout structure required locally
            let pages = sf.pages;
            if (typeof pages === 'string') {
                try {
                    pages = JSON.parse(pages);
                }
                catch (e) {
                    pages = [{ elements: [] }];
                }
            }
            if (!Array.isArray(pages))
                pages = [{ elements: [] }];
            this.columns = this.buildColumns(sf);
            this.attendanceEnabled = sf.attendance?.attendanceEnabled || false;
            this.lastUpdated = sf.updated_at || 'recently';
            await fetchSubmissionsFromApi(this.formId);
            // Auto-refresh submissions every 5 seconds
            this.pollInterval = setInterval(() => {
                fetchSubmissionsFromApi(this.formId).catch(error => console.warn('Could not refresh responses:', error));
            }, 5000);
        }
        catch (err) {
            if (err.status === 403 || err.status === 404) {
                alert("You don't have permission to view responses for this form, or it doesn't exist.");
                this.$router.push('/home');
            }
            else {
                alert("Failed to load form responses.");
                this.$router.push('/home');
            }
        }
    },
    beforeUnmount() {
        if (this.pollInterval)
            clearInterval(this.pollInterval);
    },
    computed: {
        submissions() { return getSubmissions(this.formId); },
        userInitial() {
            return store.currentUser?.name?.charAt(0)?.toUpperCase() || localStorage.getItem('jfUserName')?.charAt(0)?.toUpperCase() || 'S';
        },
    },
    methods: {
        buildColumns(sf) {
            const cols = [];
            // 1. Build from schema
            let pages = sf.pages;
            if (typeof pages === 'string') {
                try {
                    pages = JSON.parse(pages);
                }
                catch (e) {
                    pages = [{ elements: [] }];
                }
            }
            if (!Array.isArray(pages))
                pages = [{ elements: [] }];
            for (const page of pages || []) {
                for (const el of page.elements || []) {
                    if (!SKIP_TYPES.has(el.type)) {
                        cols.push({ key: `el_${el.id}`, label: el.label || el.type, type: el.type });
                    }
                }
            }
            // 2. Add Attendance System Columns if enabled
            if (sf.attendance?.attendanceEnabled) {
                cols.push({ key: 'status', label: 'Attendance Status', type: 'shorttext' });
                cols.push({ key: 'checkInTime', label: 'Check-in Time', type: 'shorttext' });
            }
            return cols;
        },
        async handleDeleteSubmission(submissionId) {
            try {
                await deleteSubmission(this.formId, submissionId);
            }
            catch (error) {
                alert(error.message || 'Could not delete this response.');
            }
        },
    },
};
</script>

<style scoped src="@/assets/styles/views-ResponsePage.css"></style>
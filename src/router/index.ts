const FormSetting = () => import('@/views/FormSetting.vue');
import { createRouter, createWebHistory } from 'vue-router';
import ClientLayout from '@/layouts/ClientLayout.vue';
const HomePage = () => import('@/views/WorkspacePage.vue');
const ProfileSettingPage = () => import('@/views/ProfileSetting.vue');
const LoginPage = () => import('@/views/LoginPage.vue');
const FormPage = () => import('@/views/FormPage.vue');
const FormShare = () => import('@/views/FormShare.vue');
const FormResponses = () => import('@/views/ResponsePage.vue');
const PublicFillForm = () => import('@/views/PublicFillForm.vue');
const FormAccessChoice = () => import('@/views/FormAccessChoice.vue');
const FormMaterials = () => import('@/views/FormMaterials.vue');
const ScanPage = () => import('@/views/ScanPage.vue');
const AdminDashboardPage = () => import('@/views/AdminDashboardPage.vue');
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/login',
        },
        {
            path: '/',
            component: ClientLayout,
            children: [
                {
                    path: 'home',
                    name: 'home',
                    component: HomePage,
                    meta: { requiresAuth: true },
                },
                {
                    path: 'profile-setting',
                    name: 'ProfileSetting',
                    component: ProfileSettingPage,
                    meta: { requiresAuth: true },
                },
            ],
        },
        {
            path: '/login',
            name: 'login',
            component: LoginPage,
            meta: { guestOnly: true },
        },
        {
            path: '/admin',
            name: 'adminDashboard',
            component: AdminDashboardPage,
            meta: { adminAuth: true },
        },
        {
            path: '/form/:id',
            name: 'formEditor',
            component: FormPage,
            meta: { requiresAuth: true },
        },
        {
            path: '/form/:id/settings',
            name: 'formSettings',
            component: FormSetting,
            meta: { requiresAuth: true },
        },
        {
            path: '/form/:id/share',
            name: 'FormShare',
            component: FormShare,
            meta: { requiresAuth: true },
        },
        {
            path: '/form/:id/responses',
            name: 'formResponses',
            component: FormResponses,
            meta: { requiresAuth: true },
        },
        {
            path: '/form/:id/fill',
            name: 'formFill',
            component: PublicFillForm,
        },
        {
            path: '/form/:id/access',
            name: 'formAccessChoice',
            component: FormAccessChoice,
        },
        {
            path: '/form/:id/materials',
            name: 'formMaterials',
            component: FormMaterials,
        },
        {
            path: '/scan',
            name: 'scan',
            component: ScanPage,
            meta: { requiresAuth: true },
        },
    ],
});
// Global Navigation Guard
router.beforeEach((to) => {
    const token = localStorage.getItem('jfAccessToken');
    const adminToken = localStorage.getItem('jfAdminToken');
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const guestOnly = to.matched.some(record => record.meta.guestOnly);
    const adminAuth = to.matched.some(record => record.meta.adminAuth);
    if (adminAuth && !adminToken) {
        return { name: 'login' };
    }
    if (requiresAuth && !token) {
        return { name: 'login' };
    }
    if (guestOnly && token) {
        return { name: 'home' };
    }
    return true;
});
export default router;

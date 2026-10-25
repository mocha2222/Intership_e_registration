<template>
  <div>
    <header
      class="site-header"
      :class="{
        'auth-theme': isAuthenticated && !isFormFill,
        'form-fill-header': isFormFill,
      }"
    >
      <div class="header-inner d-flex align-items-center px-4 mx-auto">
        <a href="#" class="logo text-decoration-none flex-shrink-0 d-flex align-items-center gap-2" @click.prevent="onLogoClick">
          <img :src="logo" alt="DEBC Event Management" class="logo-img" />
          <span class="logo-text fw-bold fs-4 d-none d-sm-inline">DEBC Event Management</span>
        </a>

        <nav
          v-if="isAuthenticated && !isFormFill"
          class="desktop-nav auth-nav d-none d-lg-flex align-items-center"
        >
          <div
            v-for="item in navItems"
            :key="item.key"
            class="nav-item position-relative"
            @mouseenter="active = item.key"
            @mouseleave="active = null"
          >
            <router-link
              v-if="!item.children"
              :to="item.path"
              class="nav-link d-flex align-items-center gap-1 px-3 py-2 text-decoration-none rounded"
            >
              {{ $label(item.labelKey) || item.label }}
            </router-link>
            <a
              v-else
              href="#"
              class="nav-link d-flex align-items-center gap-1 px-3 py-2 text-decoration-none rounded"
              :class="{ open: active === item.key }"
              @click.prevent
            >
              {{ $label(item.labelKey) || item.label }}
              <i class="bi bi-chevron-down chevron" :class="{ rotated: active === item.key }"></i>
            </a>

            <div
              v-if="item.children"
              v-show="active === item.key"
              class="dropdown-panel dd--templates position-absolute bg-white rounded-3 p-3 shadow"
            >
              <p class="dd-label text-uppercase fw-bold mb-2">Templates</p>
              <div class="d-flex flex-column" style="gap: 2px">
                <a
                  v-for="template in item.children"
                  :key="template.label"
                  href="#"
                  class="dd-item d-flex align-items-center gap-2 px-2 py-2 rounded text-decoration-none w-100"
                  @click.prevent="navigateToSelectForm"
                >
                  <span class="jf-form-icon me-1">
                    <i class="bi bi-card-text"></i>
                  </span>
                  <span class="small fw-medium text-nowrap">{{ $label(template.labelKey) || template.label }}</span>
                </a>
              </div>
            </div>
          </div>
        </nav>

        <div v-if="isAuthenticated && !isFormFill" class="d-none d-lg-flex align-items-center gap-2">
          <div ref="accountMenu" class="account-dropdown-wrap">
            <button
              class="account-avatar border-0 d-inline-flex align-items-center justify-content-center"
              type="button"
              aria-label="Account"
              @click.stop="toggleProfileDropdown"
            >
              {{ accountInitial }}
            </button>

            <ProfileDropDown
              v-if="showProfileDropdown"
              class="profile-dropdown-panel"
              :name="accountName"
              :initial="accountInitial"
              :email="accountEmail"
            />
          </div>
        </div>

        <div v-if="isAuthenticated && !isFormFill" class="header-right-mobile d-flex d-lg-none align-items-center gap-2 ms-auto">
          <button
            class="hamburger hamburger-auth d-lg-none border-0 bg-transparent"
            type="button"
            aria-label="Open navigation"
            @click="mobileOpen = true"
          >
            <i class="bi bi-list"></i>
          </button>
        </div>
      </div>
    </header>

    <transition name="slide">
      <div v-if="mobileOpen" class="mobile-overlay mobile-overlay--auth d-lg-none">
        <div class="mob-auth-topbar d-flex align-items-center justify-content-between">
          <div class="mob-auth-brand d-flex align-items-center gap-2">
            <img :src="logo" alt="DEBC Event Management" class="mob-auth-logo" />
            <span class="logo-text fw-bold fs-5">DEBC Event Management</span>
          </div>
          <button class="mob-close border-0 bg-transparent" type="button" aria-label="Close navigation" @click="mobileOpen = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="mob-auth-scroll">
          <div v-for="item in mobileAuthItems" :key="item.key" class="mob-auth-item-wrap">
            <router-link
              v-if="!item.expandable"
              :to="item.path"
              class="mob-auth-row d-flex align-items-center justify-content-between text-decoration-none"
              @click="mobileOpen = false"
            >
              <span>{{ $label(item.labelKey) || item.label }}</span>
            </router-link>
            <a
              v-else
              href="#"
              class="mob-auth-row d-flex align-items-center justify-content-between text-decoration-none"
              @click.prevent="toggleMobileAuthItem(item)"
            >
              <span>{{ $label(item.labelKey) || item.label }}</span>
              <i class="bi" :class="item.isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </a>

            <div v-if="item.key === 'templates' && item.isExpanded" class="mob-auth-sub-panel px-4 py-2">
              <a
                v-for="template in templateItems"
                :key="template.label"
                href="#"
                class="mob-auth-sub-row d-flex align-items-center gap-2 py-3 border-bottom text-decoration-none"
                @click.prevent="navigateToSelectForm"
              >
                <span class="jf-form-icon jf-form-icon--mobile me-1">
                  <i class="bi bi-card-text"></i>
                </span>
                <span class="small fw-bold">{{ $label(template.labelKey) || template.label }}</span>
              </a>
            </div>
          </div>
        </div>

        <transition name="push-up">
          <div v-if="mobileProfileOpen" class="mob-auth-profile-panel">
            <ProfileDropDown
              class="mob-auth-profile-dropdown"
              :name="accountName"
              :initial="accountInitial"
              :email="accountEmail"
            />
          </div>
        </transition>

        <div class="mob-auth-footer d-flex align-items-center justify-content-between">
          <div class="mob-auth-user d-flex align-items-center">
            <span class="mob-auth-avatar d-inline-flex align-items-center justify-content-center">{{ accountInitial }}</span>
            <div class="mob-auth-user-text">
              <p class="mb-0 mob-auth-hello">Hello,</p>
              <p class="mb-0 mob-auth-name">{{ accountName }}</p>
            </div>
          </div>

          <button
            class="mob-auth-collapse border-0 bg-transparent"
            type="button"
            aria-label="Toggle profile panel"
            @click="toggleMobileProfilePanel"
          >
            <i class="bi" :class="mobileProfileOpen ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import logo from '@/assets/logo.png';
import ProfileDropDown from '@/components/auth/ProfileMenu.vue';
import { store } from '@/store/store';
import { createForm } from '@/store/formStore';

export default {
    name: 'AppHeader',
    components: {
        ProfileDropDown,
    },
    props: {
        fillHeader: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            active: null,
            mobileOpen: false,
            mobileProfileOpen: false,
            showProfileDropdown: false,
            logo,
            navItems: [
                {
                    label: 'My Forms',
                    labelKey: 'header.myForms',
                    key: 'my-forms',
                    path: '/home',
                },
                {
                    label: 'Templates',
                    labelKey: 'header.templates',
                    key: 'templates',
                    children: [
                        { label: 'Form Templates', labelKey: 'header.formTemplates' },
                    ],
                },
            ],
            mobileAuthItems: [
                { key: 'mobile-forms', label: 'My Forms', labelKey: 'header.myForms', expandable: false, path: '/home' },
                { key: 'templates', label: 'Templates', labelKey: 'header.templates', expandable: true, isExpanded: false },
            ],
        };
    },
    computed: {
        isAuthenticated() {
            return !!store.currentUser || this.$route.matched.some(record => record.meta.requiresAuth);
        },
        isFormFill() {
            return this.fillHeader;
        },
        templateItems() {
            return this.navItems.find(item => item.key === 'templates')?.children || [];
        },
        accountInitial() {
            const name = store.currentUser?.name || '';
            return name.trim().charAt(0).toUpperCase() || 'U';
        },
        accountName() {
            return store.currentUser?.name || 'User';
        },
        accountEmail() {
            return store.currentUser?.email || '';
        },
    },
    watch: {
        mobileOpen(value) {
            if (!value) {
                this.mobileProfileOpen = false;
            }
            document.documentElement.style.overflow = value ? 'hidden' : '';
            document.body.style.overflow = value ? 'hidden' : '';
        },
        '$route.fullPath'() {
            this.showProfileDropdown = false;
            this.mobileOpen = false;
        },
    },
    mounted() {
        document.addEventListener('click', this.onDocumentClick);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.onDocumentClick);
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
    },
    methods: {
        onLogoClick() {
            this.$router.push(this.isAuthenticated ? '/home' : '/');
        },
        toggleProfileDropdown() {
            this.showProfileDropdown = !this.showProfileDropdown;
        },
        toggleMobileProfilePanel() {
            this.mobileProfileOpen = !this.mobileProfileOpen;
        },
        async navigateToSelectForm() {
            this.mobileOpen = false;
            sessionStorage.setItem('formLayoutType', 'classic');
            sessionStorage.setItem('folderName', 'All Forms');
            const tempId = `form-${Date.now()}`;
            try {
                const form = await createForm(tempId, 'Form', 'classic', null);
                this.$router.push({ name: 'formEditor', params: { id: form.id } });
            }
            catch (error) {
                console.error('Failed to create form from header:', error);
            }
        },
        toggleMobileAuthItem(item) {
            item.isExpanded = !item.isExpanded;
        },
        onDocumentClick(event) {
            const accountMenu = this.$refs.accountMenu;
            if (accountMenu && !accountMenu.contains(event.target)) {
                this.showProfileDropdown = false;
            }
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-common-AppHeader.css"></style>

<template>
  <div class="profile-setting-page">
    <section class="profile-shell">
      <div class="profile-shell-sidebar">
        <ProfileSidebar />
      </div>

      <div class="profile-shell-content">
        <ProfileAccount />
      </div>
    </section>
  </div>
</template>

<script>
import ProfileSidebar from '@/components/auth/ProfileSidebar.vue';
import ProfileAccount from '@/components/auth/ProfileForm.vue';
import { store } from '@/store/store';
export default {
    name: 'ProfileSettingPage',
    components: {
        ProfileSidebar,
        ProfileAccount,
    },
    computed: {
    },
};
</script>

<style scoped src="@/assets/styles/views-ProfileSetting.css"></style>

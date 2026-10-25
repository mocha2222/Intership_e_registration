<template>
  <aside class="profile-sidebar">
    <div class="profile-sidebar-strip"></div>
    <nav class="profile-sidebar-nav" aria-label="Profile settings">
      <div class="profile-nav-item active d-flex align-items-center" aria-current="page">
        <i class="bi bi-person-fill me-3"></i>
        <span>{{ $label('profile.account') }}</span>
      </div>
    </nav>
  </aside>
</template>

<script>
export default {
    name: 'ProfileSidebar',
};
</script>

<style scoped src="@/assets/styles/components-auth-ProfileSidebar.css"></style>

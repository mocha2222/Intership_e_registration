<template>
	<div class="profile-dropdown-card">
		
		<div class="pd-section pd-top">
			<div class="d-flex align-items-center">
				<span class="pd-avatar d-inline-flex align-items-center justify-content-center">{{ initial }}</span>
				<div class="pd-user-text">
					<p class="mb-0 pd-hello">Hello, <span class="pd-name">{{ name }}</span></p>
					<p v-if="email" class="mb-0 pd-email">{{ email }}</p>
				</div>
			</div>
		</div>

		<div class="pd-section pd-usage">
			<div class="pd-item">
				<i class="fas fa-clipboard-list pd-icon"></i>
				<span class="pd-label">Total Forms {{ store.forms.length }}</span>
			</div>
		</div>

		<div class="pd-section pd-links">
			<router-link to="/profile-setting" class="pd-item pd-link text-decoration-none">
				<i class="fas fa-cog pd-icon"></i>
				<span class="pd-label">Settings</span>
			</router-link>
		</div>

		<div class="pd-section pd-footer">
			<a href="#" class="pd-item pd-logout text-decoration-none" @click.prevent="handleLogout">
				<i class="fas fa-sign-out-alt pd-icon text-danger"></i>
				<span class="pd-label text-danger">Logout</span>
			</a>
		</div>
	</div>
</template>

<script>
import { store } from '@/store/store';
import { signOut } from '@/store/authStore';
export default {
    name: 'ProfileDropDown',
    props: {
        initial: { type: String, default: 'U' },
        name: { type: String, default: 'User' },
        email: { type: String, default: '' },
    },
    data() {
        return { store };
    },
    methods: {
        handleLogout() {
            signOut();
            this.$router.replace('/');
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-auth-ProfileMenu.css"></style>

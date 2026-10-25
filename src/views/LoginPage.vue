<template>
  <div class="jf-page">

    <div class="jf-left">
      <div class="jf-left-body">
        <login-form @submit="handleLogin" />
        <div v-if="loginError" class="lf-error-banner">{{ loginError }}</div>
      </div>

      <div class="jf-footer">
        <span class="jf-copy">© {{ year }} DEBC Event Management Inc.</span>
      </div>
    </div>

    <div class="jf-right d-none d-lg-block">
      <login-slider />
    </div>

  </div>
</template>

<script>
import LoginForm from '@/components/auth/LoginForm.vue';
import LoginSlider from '@/components/auth/LoginSlider.vue';
import { loginUser } from '@/store/authStore';
import { login as apiLogin } from '@/api/authApi';
export default {
    name: 'LoginPage',
    components: { LoginForm, LoginSlider },
    data() {
        return {
            year: new Date().getFullYear(),
            loginError: '',
        };
    },
    methods: {
        async handleLogin({ email, password }) {
            this.loginError = '';
            try {
                const data = await apiLogin({ email, password });
                if (data.user && data.user.role === 'superadmin') {
                    localStorage.setItem('jfAdminToken', data.accessToken);
                    this.$router.push('/admin');
                }
                else {
                    localStorage.setItem('jfAccessToken', data.accessToken);
                    await loginUser(data.user);
                    this.$router.push('/home');
                }
            }
            catch (e) {
                const msg = e.message || '';
                if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('Invalid credentials')) {
                    this.loginError = 'Invalid email or password. Please try again.';
                }
                else if (msg.includes('400')) {
                    this.loginError = 'Email and password are required.';
                }
                else {
                    this.loginError = 'Authentication failed. Please check your connection.';
                }
            }
        },
    },
};
</script>

<style scoped src="@/assets/styles/views-LoginPage.css"></style>

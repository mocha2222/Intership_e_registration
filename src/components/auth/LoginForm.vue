<template>
  <div class="lf-wrap">

    <div class="text-center mb-3">
      <img :src="logoDEBC" alt="DEBC Logo" class="lf-logo" />
    </div>

    <h1 class="lf-title text-center mb-1">Welcome Back!</h1>

    <p class="lf-subtitle text-center mb-4">Collect information, payments, and signatures with custom online forms.</p>

    <div class="lf-field">
      <label class="lf-label">Email <span class="text-danger">*</span></label>
      <input
        v-model="email"
        type="text"
        class="lf-input"
        :class="{ 'lf-input--error': errors.email }"
        placeholder="Enter your email address"
        @blur="validateEmailField"
      />
      <div v-if="errors.email" class="lf-error">{{ $label(errors.email.key, { field: $label('auth.email') }) }}</div>
      <div v-else class="lf-error lf-error--placeholder"></div>
    </div>

    <div class="lf-field">
      <label class="lf-label">Password <span class="text-danger">*</span></label>
      <div class="lf-password-wrap">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          class="lf-input"
          :class="{ 'lf-input--error': errors.password }"
          placeholder="Enter your password"
          @blur="validatePasswordField"
        />
        <button
          type="button"
          class="lf-password-toggle"
          @click="showPassword = !showPassword"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
        >
          <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
        </button>
      </div>
      <div v-if="errors.password" class="lf-error">{{ $label(errors.password.key, { field: $label('auth.password'), min: 8 }) }}</div>
      <div v-else class="lf-error lf-error--placeholder"></div>
    </div>

    <button class="lf-btn-primary" @click="submit">Login</button>

  </div>
</template>

<script>
import logoDEBC from '@/assets/logo.png';
import { sanitizeText, validateEmailOrUsername, validatePassword } from '@/utils/validators';
export default {
    name: 'LoginForm',
    data() {
        return {
            logoDEBC,
            email: '',
            password: '',
            showPassword: false,
            errors: { email: null, password: null },
        };
    },
    methods: {
        validateEmailField() {
            this.email = sanitizeText(this.email, 80);
            this.errors.email = validateEmailOrUsername(this.email);
            return !this.errors.email;   //if return null and then the ! turn the null into true
        },
        validatePasswordField() {
            this.password = sanitizeText(this.password, 128);
            this.errors.password = validatePassword(this.password, 8);
            return !this.errors.password;
        },
        submit() {
            const ok = this.validateEmailField() && this.validatePasswordField();
            if (!ok)
                return;
            this.$emit('submit', { email: this.email.trim(), password: this.password });
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-auth-LoginForm.css"></style>
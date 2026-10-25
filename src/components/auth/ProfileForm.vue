<template>
  <section class="profile-account">
    <h1 class="profile-account-title">
      Update <span>Account</span> and General Information
    </h1>

    <div class="profile-table">
      <div
        v-for="row in rows"
        :key="row.label"
        class="profile-row d-flex align-items-center"
      >
        <div class="profile-col-label">{{ $label('profile.' + row.labelKey) }}</div>

        <div class="profile-col-value">

          <template v-if="editingKey === row.label && row.editable && row.type !== 'password'">

            <template v-if="row.type === 'avatar'">
              <div class="avatar-edit-wrap">
                <div
                  class="profile-avatar-box d-inline-flex align-items-center justify-content-center"
                  :style="editAvatar ? `background:${editAvatar}` : ''"
                >
                  {{ (editValue || 'S').charAt(0).toUpperCase() }}
                </div>

                <input
                  v-model="editValue"
                  class="profile-input"
                  :placeholder="$label('profile.enterField', { field: $label('profile.' + row.labelKey) })"
                  maxlength="1"
                  @keyup.enter="saveEdit(row)"
                  @keyup.esc="cancelEdit"
                />
              </div>
            </template>

            <template v-else-if="row.type === 'select'">
              <span class="profile-empty">Language</span>
            </template>

            <template v-else>
              <input
                v-model="editValue"
                class="profile-input"
                :placeholder="$label('profile.enterField', { field: $label('profile.' + row.labelKey).toLowerCase() })"
                @keyup.enter="saveEdit(row)"
                @keyup.esc="cancelEdit"
                ref="activeInput"
              />
            </template>

          </template>

          <template v-else>

            <template v-if="row.type === 'avatar'">
              <div
                class="profile-avatar-box d-inline-flex align-items-center justify-content-center"
                :style="row.avatarColor ? `background:${row.avatarColor}` : ''"
              >
                {{ row.avatarLetter }}
              </div>
            </template>

            <template v-else-if="row.type === 'password'">
              <span class="profile-password-mask">••••••••</span>
            </template>

            <template v-else>
              <span :class="{ 'profile-empty': !row.value }">
                {{ row.value || $label('profile.add', { field: $label('profile.' + row.labelKey) }) }}
              </span>
            </template>

          </template>
        </div>

        <div class="profile-col-action">
          <template v-if="editingKey === row.label && row.editable && row.type !== 'password'">
            <div class="action-btns">
              <a href="#" class="profile-save-link" @click.prevent="saveEdit(row)">Save</a>
              <a href="#" class="profile-cancel-link" @click.prevent="cancelEdit">Cancel</a>
            </div>
          </template>

          <template v-else>
            <a
              v-if="row.editable"
              href="#"
              class="profile-edit-link"
              @click.prevent="startEdit(row)"
            >
              Edit
            </a>
          </template>
        </div>

      </div>
    </div>

    <div v-if="showPasswordModal" class="password-modal-backdrop" @click.self="closePasswordModal">
      <div class="password-modal-card">
        <div class="password-modal-head d-flex align-items-center justify-content-between">
          <div>
            <h3 class="password-modal-title">Change Password</h3>
            <p class="password-modal-subtitle mb-0">Enter your current password and confirm the new one.</p>
          </div>
          <button class="password-modal-close" type="button" @click="closePasswordModal">&times;</button>
        </div>

        <form class="password-modal-body" @submit.prevent="submitPasswordChange">
          <label class="password-field-label">Current Password</label>
          <div class="password-input-wrap">
            <input
              v-model.trim="passwordForm.oldPassword"
              :type="showPassword.oldPassword ? 'text' : 'password'"
              class="password-input"
              autocomplete="current-password"
            />
            <button type="button" class="password-eye-btn" @click="togglePasswordVisibility('oldPassword')">
              <i :class="showPassword.oldPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>

          <label class="password-field-label">New Password</label>
          <div class="password-input-wrap">
            <input
              v-model.trim="passwordForm.newPassword"
              :type="showPassword.newPassword ? 'text' : 'password'"
              class="password-input"
              autocomplete="new-password"
            />
            <button type="button" class="password-eye-btn" @click="togglePasswordVisibility('newPassword')">
              <i :class="showPassword.newPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>

          <label class="password-field-label">Verify New Password</label>
          <div class="password-input-wrap">
            <input
              v-model.trim="passwordForm.verifyPassword"
              :type="showPassword.verifyPassword ? 'text' : 'password'"
              class="password-input"
              autocomplete="new-password"
            />
            <button type="button" class="password-eye-btn" @click="togglePasswordVisibility('verifyPassword')">
              <i :class="showPassword.verifyPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>

          <div v-if="passwordError" class="password-error">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="password-success">{{ passwordSuccess }}</div>

          <div class="password-modal-actions">
            <button type="button" class="password-cancel-btn" @click="closePasswordModal">Cancel</button>
            <button type="submit" class="password-save-btn" :disabled="savingPassword">{{ savingPassword ? 'Saving...' : 'Save Password' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div class="profile-logout-row d-flex align-items-center justify-content-center">
      <button class="profile-logout-btn" type="button" @click="handleLogout">
        Logout
      </button>
    </div>
  </section>
</template>

<script>
import { updateProfile as apiUpdateProfile, changePassword as apiChangePassword } from "@/api/authApi";
import { store } from '@/store/store';
import { signOut } from '@/store/authStore';
export default {
    name: 'ProfileAccount',
    props: {},
    data() {
        return {
            editingKey: null,
            editValue: '',
            editAvatar: '',
            showPasswordModal: false,
            passwordForm: {
                oldPassword: '',
                newPassword: '',
                verifyPassword: '',
            },
            showPassword: {
                oldPassword: false,
                newPassword: false,
                verifyPassword: false,
            },
            passwordError: '',
            passwordSuccess: '',
            savingPassword: false,
        };
    },
    computed: {
        rows() {
            const u = store.currentUser || {};
            return [
                { label: 'Username', labelKey: 'username', value: u.username || '', editable: true },
                { label: 'Name', labelKey: 'name', value: u.name || '', editable: true },
                { label: 'Email', labelKey: 'email', value: u.email || '', editable: false },
                { label: 'Password', labelKey: 'password', value: '••••••••', type: 'password', editable: true },
                { label: 'Avatar', labelKey: 'avatar', type: 'avatar', avatarLetter: (u.name || 'U').charAt(0).toUpperCase(), avatarColor: '#5a6cc5', editable: false },
                { label: 'Phone Number', labelKey: 'phoneNumber', value: u.phoneNumber || '', editable: true },
                { label: 'Organization Name', labelKey: 'organizationName', value: u.organizationName || '', editable: true },
            ];
        }
    },
    methods: {
        startEdit(row) {
            if (row.type === 'password') {
                this.showPasswordModal = true;
                this.passwordError = '';
                this.passwordSuccess = '';
                this.passwordForm = { oldPassword: '', newPassword: '', verifyPassword: '' };
                return;
            }
            this.editingKey = row.label;
            this.editValue = row.value || row.avatarLetter || '';
            if (row.type === 'avatar') {
                this.editAvatar = row.avatarColor || '#5a6cc5';
            }
            this.$nextTick(() => {
                const el = this.$refs.activeInput;
                if (el)
                    (Array.isArray(el) ? el[0] : el).focus();
            });
        },
        async saveEdit(row) {
            const newValue = this.editValue.trim();
            
            // Map row label to backend field names
            const fieldMap = {
                'Username': 'username',
                'Name': 'name',
                'Email': 'email',
                'Phone Number': 'phoneNumber',
                'Organization Name': 'organizationName'
            };
            const fieldName = fieldMap[row.label];
            
            if (fieldName) {
                try {
                    await apiUpdateProfile({ [fieldName]: newValue });
                    
                    // Update store ONLY after successful API call.
                    // Because `rows` is a computed property dependent on `store.currentUser`,
                    // Vue will automatically re-render the row with the correct new value!
                    if (store.currentUser) {
                        store.currentUser[fieldName] = newValue;
                    }
                }
                catch (e) {
                    console.error('Failed to update profile:', e);
                    alert('Failed to save changes. Please try again.');
                }
            }
            this.editingKey = null;
            this.editValue = '';
        },
        cancelEdit() {
            this.editingKey = null;
            this.editValue = '';
        },
        closePasswordModal() {
            this.showPasswordModal = false;
            this.passwordError = '';
            this.passwordSuccess = '';
            this.passwordForm = { oldPassword: '', newPassword: '', verifyPassword: '' };
            this.showPassword = { oldPassword: false, newPassword: false, verifyPassword: false };
            this.savingPassword = false;
        },
        togglePasswordVisibility(field) {
            this.showPassword[field] = !this.showPassword[field];
        },
        async submitPasswordChange() {
            this.passwordError = '';
            this.passwordSuccess = '';
            if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword || !this.passwordForm.verifyPassword) {
                this.passwordError = 'All password fields are required.';
                return;
            }
            if (this.passwordForm.newPassword.length < 8) {
                this.passwordError = 'New password must be at least 8 characters.';
                return;
            }
            if (this.passwordForm.newPassword !== this.passwordForm.verifyPassword) {
                this.passwordError = 'New password and verification do not match.';
                return;
            }
            this.savingPassword = true;
            try {
                await apiChangePassword(this.passwordForm.oldPassword, this.passwordForm.newPassword);
                this.passwordSuccess = 'Password updated successfully.';
                setTimeout(() => this.closePasswordModal(), 1000);
            }
            catch (e) {
                const message = e?.message || '';
                if (message.includes('Current password is incorrect.')) {
                    this.passwordError = 'Current password is incorrect.';
                }
                else if (message.includes('does not have a password')) {
                    this.passwordError = 'This account does not have a password.';
                }
                else {
                    this.passwordError = message || 'Failed to save changes. Please try again.';
                }
            }
            finally {
                this.savingPassword = false;
            }
        },
        handleLogout() {
            signOut();
            this.$router.push('/login');
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-auth-ProfileForm.css"></style>
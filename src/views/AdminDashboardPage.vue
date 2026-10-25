<template>
  <div class="adm-page">
    
    <aside class="adm-sidebar">
      <div class="adm-logo">
        <img src="@/assets/logo.png" alt="DEBC" class="adm-logo-img" />
        <span class="adm-logo-text">DEBC Admin</span>
      </div>

      <nav class="adm-nav">
        <div class="adm-nav-item active">
          <svg viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/></svg>
          <span>Users</span>
        </div>
      </nav>

      <button class="adm-logout" @click="logout">
        <svg viewBox="0 0 24 24" fill="none"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/></svg>
        <span>Logout</span>
      </button>
    </aside>

    <main class="adm-main">
      
      <header class="adm-topbar">
        <div>
          <h1 class="adm-page-title">User Management</h1>
          <p class="adm-page-sub">{{ users.length }} registered user{{ users.length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="adm-create-btn" @click="showCreateModal = true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
          Create Account
        </button>
      </header>

      <div class="adm-card">
        <div class="adm-card-header">
          <span class="adm-card-title">All Users</span>
        </div>
        <div v-if="loadingUsers" class="adm-empty">
          <div class="adm-spinner"></div>
          <p>Loading users…</p>
        </div>
        <div v-else-if="users.length === 0" class="adm-empty">
          <svg viewBox="0 0 24 24" fill="none" width="48" height="48"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#B0B8CC"/></svg>
          <p>No users yet. Create the first account!</p>
        </div>
        <table v-else class="adm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, idx) in users" :key="user.id" class="adm-row">
              <td class="adm-td-num">{{ idx + 1 }}</td>
              <td>
                <div class="adm-user-cell">
                  <div class="adm-avatar">{{ initials(user.name) }}</div>
                  <span class="adm-user-name">{{ user.name }}</span>
                </div>
              </td>
              <td class="adm-td-email">{{ user.email }}</td>
              <td class="adm-td-date">{{ formatDate(user.createdAt) }}</td>
              <td>
                <button class="adm-delete-btn" @click="confirmDelete(user)" :disabled="deleting === user.id">
                  <span v-if="deleting === user.id" class="adm-spinner-sm"></span>
                  <svg v-else viewBox="0 0 24 24" fill="none"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showCreateModal" class="adm-modal-overlay" @click.self="closeModal">
          <div class="adm-modal">
            <div class="adm-modal-header">
              <h3 class="adm-modal-title">Create New Account</h3>
              <button class="adm-modal-close" @click="closeModal">
                <svg viewBox="0 0 24 24" fill="none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
              </button>
            </div>
            <div class="adm-modal-body">
              <form @submit.prevent="handleCreateUser">
                
                <div class="adm-field">
                  <label class="adm-label">Full Name</label>
                  <input type="text" class="adm-input" v-model="form.name" required placeholder="e.g. John Doe" />
                </div>
                
                <div class="adm-field">
                  <label class="adm-label">Email Address</label>
                  <input type="email" class="adm-input" v-model="form.email" required placeholder="john@example.com" />
                </div>
                
                <div class="adm-field">
                  <label class="adm-label">Password</label>
                  <div class="adm-input-wrap">
                    <input :type="showPwd ? 'text' : 'password'" class="adm-input" v-model="form.password" required minlength="8" placeholder="Min. 8 characters" />
                    <button type="button" class="adm-eye" @click="showPwd = !showPwd">
                      <svg v-if="showPwd" viewBox="0 0 24 24" fill="none"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z" fill="currentColor"/></svg>
                    </button>
                  </div>
                </div>
                
                <div class="adm-field">
                  <label class="adm-label">Confirm Password</label>
                  <div class="adm-input-wrap">
                    <input :type="showConfirmPwd ? 'text' : 'password'" class="adm-input" v-model="form.confirmPassword" required minlength="8" placeholder="Repeat password" />
                    <button type="button" class="adm-eye" @click="showConfirmPwd = !showConfirmPwd">
                      <svg v-if="showConfirmPwd" viewBox="0 0 24 24" fill="none"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z" fill="currentColor"/></svg>
                    </button>
                  </div>
                </div>

                <div v-if="errorMsg" class="adm-alert adm-alert-error">{{ errorMsg }}</div>
                <div v-if="successMsg" class="adm-alert adm-alert-success">{{ successMsg }}</div>

                <div class="adm-modal-footer">
                  <button type="button" class="adm-btn-cancel" @click="closeModal">Cancel</button>
                  <button type="submit" class="adm-btn-create" :disabled="creating">
                    <span v-if="creating" class="adm-spinner-sm"></span>
                    <span v-else>Create Account</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="deleteTarget" class="adm-modal-overlay" @click.self="deleteTarget = null">
          <div class="adm-modal adm-modal-sm">
            <div class="adm-modal-header">
              <h3 class="adm-modal-title">Delete User</h3>
              <button class="adm-modal-close" @click="deleteTarget = null">
                <svg viewBox="0 0 24 24" fill="none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
              </button>
            </div>
            <div class="adm-modal-body">
              <p class="adm-delete-msg">Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>? This action cannot be undone.</p>
              <div class="adm-modal-footer">
                <button class="adm-btn-cancel" @click="deleteTarget = null">Cancel</button>
                <button class="adm-btn-danger" @click="handleDelete" :disabled="deleting !== null">
                  <span v-if="deleting !== null" class="adm-spinner-sm"></span>
                  <span v-else>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import { adminListUsers, adminCreateUser, adminDeleteUser } from '@/api/adminApi';
export default {
    name: 'AdminDashboardPage',
    data() {
        return {
            users: [],
            loadingUsers: false,
            showCreateModal: false,
            creating: false,
            form: { name: '', email: '', password: '', confirmPassword: '' },
            showPwd: false,
            showConfirmPwd: false,
            errorMsg: '',
            successMsg: '',
            deleteTarget: null,
            deleting: null,
        };
    },
    mounted() {
        this.fetchUsers();
    },
    methods: {
        async fetchUsers() {
            this.loadingUsers = true;
            try {
                this.users = await adminListUsers();
            }
            catch (err) {
                if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
                    this.logout();
                }
            }
            finally {
                this.loadingUsers = false;
            }
        },
        async handleCreateUser() {
            this.errorMsg = '';
            this.successMsg = '';
            if (this.form.password !== this.form.confirmPassword) {
                this.errorMsg = 'Passwords do not match!';
                return;
            }
            this.creating = true;
            try {
                await adminCreateUser({ name: this.form.name, email: this.form.email, password: this.form.password });
                this.successMsg = 'Account created successfully!';
                this.form = { name: '', email: '', password: '', confirmPassword: '' };
                await this.fetchUsers();
                setTimeout(() => { this.closeModal(); }, 1500);
            }
            catch (err) {
                this.errorMsg = err.message || 'Failed to create account';
            }
            finally {
                this.creating = false;
            }
        },
        confirmDelete(user) {
            this.deleteTarget = user;
        },
        async handleDelete() {
            if (!this.deleteTarget)
                return;
            this.deleting = this.deleteTarget.id;
            try {
                await adminDeleteUser(this.deleteTarget.id);
                this.users = this.users.filter(u => u.id !== this.deleteTarget.id);
                this.deleteTarget = null;
            }
            catch (err) {
                alert(err.message || 'Failed to delete user');
            }
            finally {
                this.deleting = null;
            }
        },
        closeModal() {
            this.showCreateModal = false;
            this.form = { name: '', email: '', password: '', confirmPassword: '' };
            this.errorMsg = '';
            this.successMsg = '';
            this.showPwd = false;
            this.showConfirmPwd = false;
        },
        logout() {
            localStorage.removeItem('jfAdminToken');
            this.$router.push('/login');
        },
        initials(name) {
            if (!name)
                return '?';
            return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        },
        formatDate(d) {
            if (!d)
                return '—';
            return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        },
    }
};
</script>

<style scoped src="@/assets/styles/views-AdminDashboardPage.css"></style>

import { createApp } from 'vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './style.css';
import App from './App.vue';
import router from './router';
import { restoreSession } from './store/authStore';
import { resolveImageUrl } from './api/http';
import { englishLabel } from './utils/labels';
async function startApp() {
    document.documentElement.lang = 'en';
    await restoreSession();
    const app = createApp(App);
    app.config.globalProperties.$resolveImg = resolveImageUrl;
    app.config.globalProperties.$label = englishLabel;
    app.use(router).mount('#app');
}
startApp();

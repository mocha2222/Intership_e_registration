<template>
  <Header />
  <div style="height: 75px;"></div>
  <router-view />
  <Footer />
</template>

<script lang="ts">
import Header from '@/components/common/AppHeader.vue';
import Footer from '@/components/common/AppFooter.vue';
export default {
    name: 'ClientLayout',
    components: {
        Header,
        Footer,
    },
};
</script>

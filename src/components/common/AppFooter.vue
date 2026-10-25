<template>
  <footer class="site-footer d-flex align-items-center px-4">
    <div class="copyright text-start">
      DEBC © {{ currentYear }}, - Digital Economy and Business Committee. All rights reserved.
    </div>

    <div class="ms-auto d-flex align-items-center gap-4">
      <div class="footer-links">
        <a href="#" class="text-decoration-none">Term of Use</a> -
        <a href="#" class="text-decoration-none">Privacy</a>
      </div>
      <div class="scroll-top">
        <button @click="scrollToTop" class="btn-scroll-top">
          <i class="bi bi-arrow-up text-white"></i>
        </button>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
    name: 'JotformFooter',
    data() {
        return {
            currentYear: new Date().getFullYear()
        };
    },
    methods: {
        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-common-AppFooter.css"></style>
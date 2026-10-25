<template>
  <div class="jf-slider">

    <div class="jf-top-text text-center">
      <transition name="jf-fade-text" mode="out-in">
        <div :key="currentIndex">
          <p class="jf-label">{{ current.label }}</p>
          <h2 class="jf-title fw-bold">{{ current.headline }}</h2>
        </div>
      </transition>
    </div>

    <div class="jf-img-wrap">
      <transition name="jf-fade" mode="out-in">
        <img
          :key="currentIndex"
          :src="current.image"
          :alt="current.label"
          class="jf-img"
        />
      </transition>
    </div>

    <div class="jf-dots">
      <span
        v-for="(slide, index) in slides"
        :key="index"
        class="jf-dot"
        :class="{ active: index === currentIndex }"
        @click="currentIndex = index"
      ></span>
    </div>

  </div>
</template>

<script>
import img1 from '@/assets/login/1.png';
import img2 from '@/assets/login/2.png';
import img3 from '@/assets/login/3.png';
import img4 from '@/assets/login/4.png';
export default {
    name: 'LoginSlider',
    data() {
        return {
            currentIndex: 0,
            timer: null,
            slides: [
                {
                    label: 'DEBC Event Management Form Builder',
                    headline: 'Build powerful forms in minutes without coding',
                    image: img1,
                },
                {
                    label: 'DEBC Event Management Tables',
                    headline: 'Organize and manage all your data in one place',
                    image: img2,
                },
                {
                    label: 'DEBC Event Management Sign',
                    headline: 'Collect legally binding e-signatures effortlessly',
                    image: img3,
                },
                {
                    label: 'DEBC Event Management PDF Editor',
                    headline: 'Automatically create polished, designed documents',
                    image: img4,
                },
            ],
        };
    },
    computed: {
        current() {
            return this.slides[this.currentIndex];
        },
    },
    mounted() {
        this.timer = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.slides.length;
        }, 4000);
    },
    beforeUnmount() {
        clearInterval(this.timer);
    },
};
</script>

<style scoped src="@/assets/styles/components-auth-LoginSlider.css"></style>

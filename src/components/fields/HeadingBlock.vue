<template>
  <div
    class="block-wrapper"
    :class="{ 'edit-mode': isActive && mode === 'builder', 'public-mode': mode === 'public' }"
  >
    
    <template v-if="mode === 'builder'">
      <template v-if="isActive">
        <input
          ref="headingInput"
          v-model="localHeading"
          class="edit-input heading-input"
          placeholder="Heading"
        />
        <input
          v-model="localSubheading"
          class="edit-input subheading-input"
          placeholder="Subheader"
        />
      </template>
      <template v-else>
        <h2 class="view-heading">{{ displayHeading }}</h2>
        <p class="view-subheading">{{ localSubheading || 'subheader' }}</p>
      </template>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="fill-heading">
        <h3>{{ displayHeading }}</h3>
        <p v-if="localSubheading && localSubheading !== 'subheader'" class="fill-subtext">{{ localSubheading }}</p>
      </div>
    </template>
  </div>
</template>

<script>
export default {
    name: 'HeadingBlock',
    emits: ['update:heading', 'update:subheading', 'update:settings', 'delete'],
    props: {
        heading: { type: String, default: 'Heading' },
        subheading: { type: String, default: 'subheader' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
    },
    data() {
        return {
            localHeading: this.heading,
            localSubheading: this.subheading,
        };
    },
    computed: {
        displayHeading() {
            if (this.elSettings?.headingKey && this.localHeading === this.heading) {
                return this.$label(this.elSettings.headingKey);
            }
            return this.localHeading || 'Heading';
        }
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                if (this.localHeading !== this.heading) {
                    const newSettings = { ...this.elSettings };
                    delete newSettings.headingKey;
                    this.$emit('update:settings', newSettings);
                }
                this.$emit('update:heading', this.localHeading);
                this.$emit('update:subheading', this.localSubheading);
            }
            else if (val && this.mode === 'builder') {
                this.$nextTick(() => this.$refs.headingInput && this.$refs.headingInput.focus());
            }
        },
        heading(v) { if (this.mode === 'builder')
            this.localHeading = v; },
        subheading(v) { if (this.mode === 'builder')
            this.localSubheading = v; }
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-DisplayElement.css"></style>
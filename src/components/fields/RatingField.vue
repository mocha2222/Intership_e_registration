<template>
  <div
    class="block-wrapper"
    :class="{ 'edit-mode': isActive && mode === 'builder', 'public-mode': mode === 'public' }"
  >
    
    <FormElementLabel
      v-model="localLabel"
      :label-key="elSettings?.labelKey"
      :is-active="isActive"
      :mode="mode"
      placeholder="Star Rating"
      default-label="Star Rating"
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      
      <div class="stars-row">
        <span
          v-for="n in 5"
          :key="n"
          class="star"
          :class="{ filled: n <= hovered || (!hovered && n <= selected) }"
          @mouseenter="isActive && (hovered = n)"
          @mouseleave="isActive && (hovered = 0)"
          @click="isActive && (selected = n)"
        >★</span>
      </div>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="fill-stars" :class="{ 'error': hasError }">
        <i
          v-for="n in 5"
          :key="n"
          class="bi"
          :class="n <= (answer || 0) ? 'bi-star-fill text-warning' : 'bi-star text-secondary'"
          :style="{ cursor: readonly ? 'default' : 'pointer', fontSize: '24px', marginRight: '4px' }"
          @click="!readonly && $emit('update:answer', n)"
        ></i>
      </div>
    </template>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'StarRatingBlock',
    components: {
        FormElementLabel
    },
    emits: ['update:label', 'update:settings', 'update:answer', 'delete', 'update:rating'],
    props: {
        label: { type: String, default: 'Star Rating' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        answer: { type: Number, default: 0 },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
    data() {
        return {
            localLabel: this.label,
            selected: 0,
            hovered: 0,
        };
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                this.syncBuilderState();
                this.$emit('update:rating', this.selected);
            }
        },
        label(v) { if (this.mode === 'builder')
            this.localLabel = v; }
    },
    methods: {
        syncBuilderState() {
            const newSettings = { ...this.elSettings };
            delete newSettings.labelKey;
            this.$emit('update:label', this.localLabel);
            this.$emit('update:settings', newSettings);
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-fields-RatingField.css"></style>
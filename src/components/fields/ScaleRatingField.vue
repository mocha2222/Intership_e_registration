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
      placeholder="Scale Rating"
      default-label="Scale Rating"
      @edit="syncBuilderState"
    />

    <template v-if="mode === 'builder'">
      
      <div class="scale-row">
        <div v-for="n in scaleMax" :key="n" class="scale-item">
          <button
            class="scale-btn"
            :class="{ selected: selected === n }"
            @click="isActive && (selected = n)"
          >{{ n }}</button>
        </div>
      </div>

      <div class="scale-meta-editors">
        <template v-if="isActive">
          <input v-model="localMinLabel" class="sub-label-input" placeholder="Worst" @input="syncBuilderState" />
          <input v-model="localMaxLabel" class="sub-label-input" placeholder="Best" @input="syncBuilderState" />
        </template>
        <template v-else>
          <span class="scale-meta-label">{{ displayMinLabel }}</span>
          <span class="scale-meta-label">{{ displayMaxLabel }}</span>
        </template>
      </div>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="fill-scale" :class="{ 'error': hasError }">
        <span class="scale-label">{{ minLabel || 'Worst' }}</span>
        <div class="scale-buttons">
          <button
            v-for="n in (scaleMax || 5)"
            :key="n"
            class="scale-btn-public"
            :class="{ active: answer === n }"
            :disabled="readonly"
            @click="!readonly && $emit('update:answer', n)"
          >{{ n }}</button>
        </div>
        <span class="scale-label">{{ maxLabel || 'Best' }}</span>
      </div>
    </template>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'ScaleRatingBlock',
    components: {
        FormElementLabel
    },
    emits: ['update:label', 'update:settings', 'update:answer', 'delete', 'update:rating'],
    props: {
        label: { type: String, default: 'Scale Rating' },
        scaleMax: { type: Number, default: 5 },
        minLabel: { type: String, default: 'Worst' },
        maxLabel: { type: String, default: 'Best' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        answer: { type: Number, default: null },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
    data() {
        return {
            localLabel: this.label,
            localMinLabel: this.minLabel,
            localMaxLabel: this.maxLabel,
            selected: null,
        };
    },
    computed: {
        displayMinLabel() {
            return this.elSettings?.minLabel || this.localMinLabel || (this.minLabel === 'Worst' ? 'Worst' : this.minLabel);
        },
        displayMaxLabel() {
            return this.elSettings?.maxLabel || this.localMaxLabel || (this.maxLabel === 'Best' ? 'Best' : this.maxLabel);
        }
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
            const newSettings = {
                ...this.elSettings,
                minLabel: this.localMinLabel,
                maxLabel: this.localMaxLabel,
            };
            delete newSettings.labelKey;
            this.$emit('update:label', this.localLabel);
            this.$emit('update:settings', newSettings);
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-ScaleRatingField.css"></style>
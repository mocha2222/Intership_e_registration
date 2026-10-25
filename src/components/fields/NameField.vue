<template>
  <div
    class="block-wrapper"
    :class="{ 'edit-mode': isActive && mode === 'builder', 'public-mode': mode === 'public' }"
  >
    
    <template v-if="mode === 'builder'">
      
      <FormElementLabel
        v-model="localLabel"
        :label-key="elSettings?.labelKey"
        :is-active="isActive"
        :mode="mode"
        placeholder="Full Name"
        default-label="Full Name"
        @edit="syncBuilderState"
      />

      <div class="name-row">
        
        <div class="name-col">
          <input
            v-model="localFirst"
            class="name-input"
            :readonly="!isActive"
          />
          <input
            v-if="isActive"
            v-model="localFirstLabel"
            class="sub-label-input"
            @input="syncBuilderState"
          />
          <span v-else class="sub-label">{{ displayFirstLabel }}</span>
        </div>

        <div class="name-col position-relative">
          <input
            v-model="localLast"
            class="name-input"
            :readonly="!isActive"
          />
          <span v-if="isActive" class="drag-handle">⠿</span>
          <input
            v-if="isActive"
            v-model="localLastLabel"
            class="sub-label-input"
            @input="syncBuilderState"
          />
          <span v-else class="sub-label">{{ displayLastLabel }}</span>
        </div>
      </div>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      <FormElementLabel
        v-model="localLabel"
        :label-key="elSettings?.labelKey"
        :is-active="isActive"
        :mode="mode"
        default-label="Full Name"
      />
      <div class="name-row public-name-row">
        <div class="name-col">
          <input
            type="text"
            class="fill-input"
            :class="{ 'input-error': hasError }"
            :value="firstAnswer"
            :readonly="readonly"
            @input="$emit('update:firstAnswer', $event.target.value)"
          />
          <span class="sub-label">{{ displayFirstLabel }}</span>
        </div>
        <div class="name-col">
          <input
            type="text"
            class="fill-input"
            :class="{ 'input-error': hasError }"
            :value="lastAnswer"
            :readonly="readonly"
            @input="$emit('update:lastAnswer', $event.target.value)"
          />
          <span class="sub-label">{{ displayLastLabel }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'NameBlock',
    components: {
        FormElementLabel
    },
    emits: ['update:label', 'update:settings', 'update:firstName', 'update:lastName', 'update:firstAnswer', 'update:lastAnswer', 'delete'],
    props: {
        label: { type: String, default: 'Full Name' },
        firstLabel: { type: String, default: 'First Name' },
        lastLabel: { type: String, default: 'Last Name' },
        firstName: { type: String, default: '' },
        lastName: { type: String, default: '' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        firstAnswer: { type: String, default: '' },
        lastAnswer: { type: String, default: '' },
        readonly: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
    },
    data() {
        return {
            localFirst: this.firstName,
            localLast: this.lastName,
            localLabel: this.label,
            localFirstLabel: this.elSettings?.firstLabel || '',
            localLastLabel: this.elSettings?.lastLabel || '',
        };
    },
    computed: {
        displayFirstLabel() {
            return this.elSettings?.firstLabel || 'First Name';
        },
        displayLastLabel() {
            return this.elSettings?.lastLabel || 'Last Name';
        }
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                this.$emit('update:firstName', this.localFirst);
                this.$emit('update:lastName', this.localLast);
                this.syncBuilderState();
            }
        },
        label(v) { if (this.mode === 'builder')
            this.localLabel = v; },
        elSettings: {
            deep: true,
            handler(v) {
                if (this.mode === 'builder' && !this.isActive) {
                    this.localFirstLabel = v?.firstLabel || '';
                    this.localLastLabel = v?.lastLabel || '';
                }
            }
        }
    },
    methods: {
        syncBuilderState() {
            const newSettings = {
                ...this.elSettings,
                firstLabel: this.localFirstLabel,
                lastLabel: this.localLastLabel,
            };
            delete newSettings.labelKey;
            this.$emit('update:label', this.localLabel);
            this.$emit('update:settings', newSettings);
        },
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-NameField.css"></style>
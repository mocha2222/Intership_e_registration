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
        placeholder="Address"
        default-label="Address"
        @edit="syncBuilderState"
      />

      <div class="field-group">
        <input :value="address.street1" class="addr-input" readonly />
        <input
          v-if="isActive"
          v-model="localStreet1Label"
          class="sub-label-input"
          placeholder="Street Address"
        />
        <span v-else class="sub-label">{{ displayStreet1Label }}</span>
      </div>

      <div class="field-group position-relative">
        <input :value="address.street2" class="addr-input" readonly />
        <span v-if="isActive" class="drag-handle">⠿</span>
        <input
          v-if="isActive"
          v-model="localStreet2Label"
          class="sub-label-input"
          placeholder="Street Address Line 2"
        />
        <span v-else class="sub-label">{{ displayStreet2Label }}</span>
      </div>

      <div class="row no-gutters field-group">
        <div class="col pr-2">
          <input :value="address.city" class="addr-input" readonly />
          <input
            v-if="isActive"
            v-model="localCityLabel"
            class="sub-label-input"
            placeholder="City"
          />
          <span v-else class="sub-label">{{ displayCityLabel }}</span>
        </div>
        <div class="col pl-2">
          <input :value="address.state" class="addr-input" readonly />
          <input
            v-if="isActive"
            v-model="localStateLabel"
            class="sub-label-input"
            placeholder="State"
          />
          <span v-else class="sub-label">{{ displayStateLabel }}</span>
        </div>
      </div>

      <div class="field-group">
        <input :value="address.postal" class="addr-input" readonly />
        <input
          v-if="isActive"
          v-model="localPostalLabel"
          class="sub-label-input"
          placeholder="Postal Code"
        />
        <span v-else class="sub-label">{{ displayPostalLabel }}</span>
      </div>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete" @click.stop="$emit('delete')">
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
        default-label="Address"
      />

      <div class="field-group">
        <input
          class="addr-input fill-input"
          :class="{ 'input-error': hasError }"
          :value="streetAnswer"
          :readonly="readonly"
          @input="$emit('update:streetAnswer', $event.target.value)"
        />
        <p v-if="displayStreet1Label" class="fill-help-text">{{ displayStreet1Label }}</p>
      </div>

      <div class="field-group">
        <input
          class="addr-input fill-input"
          :value="streetAnswer2"
          :readonly="readonly"
          @input="$emit('update:streetAnswer2', $event.target.value)"
        />
        <p v-if="displayStreet2Label" class="fill-help-text">{{ displayStreet2Label }}</p>
      </div>

      <div class="row no-gutters field-group">
        <div class="col pr-2">
          <input
            class="addr-input fill-input"
            :value="cityAnswer"
            :readonly="readonly"
            @input="$emit('update:cityAnswer', $event.target.value)"
          />
          <p v-if="displayCityLabel" class="fill-help-text">{{ displayCityLabel }}</p>
        </div>
        <div class="col pl-2">
          <input
            class="addr-input fill-input"
            :value="stateAnswer"
            :readonly="readonly"
            @input="$emit('update:stateAnswer', $event.target.value)"
          />
          <p v-if="displayStateLabel" class="fill-help-text">{{ displayStateLabel }}</p>
        </div>
      </div>

      <div class="field-group">
        <input
          class="addr-input fill-input"
          :value="postalAnswer"
          :readonly="readonly"
          @input="$emit('update:postalAnswer', $event.target.value)"
        />
        <p v-if="displayPostalLabel" class="fill-help-text">{{ displayPostalLabel }}</p>
      </div>
    </template>
  </div>
</template>

<script>
import FormElementLabel from '@/components/fields/FieldLabel.vue';
export default {
    name: 'AddressBlock',
    components: {
        FormElementLabel
    },
    emits: ['update:label', 'update:settings', 'update:streetAnswer', 'update:streetAnswer2', 'update:cityAnswer', 'update:stateAnswer', 'update:postalAnswer', 'delete'],
    props: {
        label: { type: String, default: 'Address' },
        address: {
            type: Object,
            default: () => ({ street1: '', street2: '', city: '', state: '', postal: '' }),
        },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
        hasError: { type: Boolean, default: false },
        readonly: { type: Boolean, default: false },
        streetAnswer: { type: String, default: '' },
        streetAnswer2: { type: String, default: '' },
        cityAnswer: { type: String, default: '' },
        stateAnswer: { type: String, default: '' },
        postalAnswer: { type: String, default: '' },
    },
    data() {
        return {
            localLabel: this.label,
            localStreet1Label: this.elSettings?.street1Label || '',
            localStreet2Label: this.elSettings?.street2Label || '',
            localCityLabel: this.elSettings?.cityLabel || '',
            localStateLabel: this.elSettings?.stateLabel || '',
            localPostalLabel: this.elSettings?.postalLabel || '',
        };
    },
    computed: {
        displayLabel() {
            if (this.elSettings?.labelKey && this.localLabel === this.label) {
                return this.$label(this.elSettings.labelKey);
            }
            return this.localLabel || 'Address';
        },
        displayStreet1Label() { return this.elSettings?.street1Label || 'Street Address'; },
        displayStreet2Label() { return this.elSettings?.street2Label || 'Street Address Line 2'; },
        displayCityLabel() { return this.elSettings?.cityLabel || 'City'; },
        displayStateLabel() { return this.elSettings?.stateLabel || 'State'; },
        displayPostalLabel() { return this.elSettings?.postalLabel || 'Postal Code'; },
    },
    watch: {
        isActive(val) {
            if (!val && this.mode === 'builder') {
                this.syncBuilderState();
            }
        },
        label(v) { if (this.mode === 'builder')
            this.localLabel = v; }
    },
    methods: {
        syncBuilderState() {
            const newSettings = {
                ...this.elSettings,
                street1Label: this.localStreet1Label,
                street2Label: this.localStreet2Label,
                cityLabel: this.localCityLabel,
                stateLabel: this.localStateLabel,
                postalLabel: this.localPostalLabel,
            };
            delete newSettings.labelKey;
            this.$emit('update:settings', newSettings);
            this.$emit('update:label', this.localLabel);
        }
    }
};
</script>

<style scoped src="@/assets/styles/components-fields-AddressField.css"></style>
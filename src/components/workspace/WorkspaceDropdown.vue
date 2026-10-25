<template>
  <div class="workspace-dropdown" role="menu" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="workspace-dropdown-item d-flex align-items-center justify-content-between w-100 border-0"
      :class="{ active: modelValue === option.value }"
      @click="select(option.value)"
    >
      <span class="d-flex align-items-center">
        <i v-if="option.icon" :class="option.icon + ' me-2'"></i>
        {{ $label(option.labelKey) }}
      </span>

      <span
        v-if="showCheck && modelValue === option.value"
        class="workspace-dropdown-check d-inline-flex align-items-center justify-content-center"
      >
        <i class="bi bi-check2"></i>
      </span>
    </button>
  </div>
</template>

<script>
export default {
    name: 'WorkspaceDropdown',
    props: {
        ariaLabel: { type: String, default: 'Options' },
        modelValue: { type: String, default: '' },
        options: { type: Array, default: () => [] },
        showCheck: { type: Boolean, default: true },
    },
    emits: ['update:modelValue', 'select'],
    methods: {
        select(value) {
            this.$emit('update:modelValue', value);
            this.$emit('select', value);
        },
    },
};
</script>

<style scoped>
.workspace-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 200;
  min-width: 180px;
  background: #f5f8fc;
  border: 1px solid #dce4f0;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 8px 0;
  animation: workspace-dropdown-slide-down 0.4s ease-out;
}

.workspace-dropdown-item {
  width: calc(100% - 12px) !important;
  margin: 2px 6px;
  padding: 10px 16px;
  border-radius: 6px;
  background: transparent;
  color: #2c3345;
  font-size: 13px;
  text-align: left;
  transition: background 0.4s ease, color 0.4s ease;
}

.workspace-dropdown-item:hover {
  background: #dee7f3;
}

.workspace-dropdown-item.active {
  background: #2261af;
  color: #fff;
  font-weight: 600;
}

.workspace-dropdown-check {
  font-size: 16px;
}

.workspace-dropdown-item:focus {
  outline: none;
  box-shadow: none;
}

.workspace-dropdown-item:focus-visible {
  outline: 2px solid #2261af;
  outline-offset: -2px;
}

@keyframes workspace-dropdown-slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

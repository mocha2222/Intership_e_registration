<script>
export default {
    name: 'ResponseFilters',
    props: {
        modelValue: {
            type: String,
            default: '',
        },
    },
    emits: ['update:modelValue'],
    methods: {
        update(event) {
            this.$emit('update:modelValue', event.target.value);
        },
    },
};
</script>
<template>
  <div class="search-wrap">
    <i class="bi bi-search search-icon"></i>
    <input :value="modelValue" class="jf-search" placeholder="Search responses..." aria-label="Search responses" @input="update" />
  </div>
</template>
<style scoped src="@/assets/styles/components-responses-ResponseTable.css"></style>

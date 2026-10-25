<template>
  <div class="py-4 text-center" role="status">
    <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
    {{ message }}
  </div>
</template>
<script>
export default {
    name: 'LoadingState',
    props: {
        message: {
            type: String,
            default: 'Loading...',
        },
    },
};
</script>

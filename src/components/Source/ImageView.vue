<template>
  <a-image :src="sourceUrl" :preview-mask="false" />
</template>

<script setup lang="ts">
import { Image as AImage } from 'ant-design-vue';
defineProps({
  sourceUrl: {
    type: String,
    required: true,
  },
});
</script>

<style scoped></style>

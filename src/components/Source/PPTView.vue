<template>
  <div class="preview-content">
    <vue-office-pptx
      :src="sourceUrl"
      @rendered="renderedHandler"
      @error="errorHandler"
    />
  </div>
</template>
<script lang="ts" setup>
import VueOfficePptx from '@vue-office/pptx';
import { inject } from 'vue';

const props = defineProps({
  sourceUrl: {
    type: String,
    required: true,
  },
});

const setPreLoading: (value: boolean) => void = inject('setPreLoading');
const setScrollToCenter: () => void = inject('setScrollToCenter');
const resizePreview: () => void = inject('resizePreview');

function renderedHandler() {
  setPreLoading(false);
  setScrollToCenter();
  resizePreview();
}

function errorHandler(e) {
  if (!props.sourceUrl) {
    console.log('读取缓存');
  } else {
    console.log('渲染失败', e);
  }
}
</script>
<style lang="scss">
.preview-content {
  background-color: white !important;
  .pptx-preview-wrapper {
    overflow-y: initial !important;
  }
}
</style>

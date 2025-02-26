<template>
  <div class="preview-content">
    <vue-office-docx
      :src="sourceUrl"
      @rendered="renderedHandler"
      @error="errorHandler"
    />
  </div>
</template>
<script lang="ts" setup>
import VueOfficeDocx from '@vue-office/docx';
import '@vue-office/docx/lib/index.css';
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
<style lang="scss" scoped>
.preview-content {
  :deep(.docx-wrapper) {
    background-color: white !important;
    .docx {
      box-shadow: none !important;
    }
  }
}
</style>

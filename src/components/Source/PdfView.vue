<template>
  <div class="preview-content">
    <vue-office-pdf
      :src="sourceUrl"
      @rendered="renderedHandler"
      @error="errorHandler"
    />
  </div>
</template>
<script lang="ts" setup>
import VueOfficePdf from '@vue-office/pdf';
import { inject } from 'vue';

const props = defineProps({
  sourceUrl: {
    type: String,
    required: true,
  },
});

const setPreLoading: (value: boolean) => void = inject('setPreLoading');
const setScrollToCenter: () => void = inject('setScrollToCenter');
const setTotal: (total: number) => void = inject('setTotal');
const resizePreview: () => void = inject('resizePreview');

function renderedHandler() {
  setPreLoading(false);
  setScrollToCenter();
  resizePreview();
  setCanvas();
}

//给canvas添加属性
const setCanvas = () => {
  const canvasElements = document.querySelectorAll(
    '.vue-office-pdf-wrapper canvas',
  );
  canvasElements.forEach((canvas, index) => {
    canvas.setAttribute('data-page', (index + 1).toString());
  });
  const total = canvasElements.length;
  setTotal(total);
};

function errorHandler(e) {
  if (!props.sourceUrl) {
    console.log('读取缓存');
  } else {
    console.log('渲染失败', e);
  }
}
</script>
<style lang="scss" scoped>
:deep(.vue-office-pdf-wrapper) {
  width: 720px !important;
  background-color: white !important;
  padding: 0 !important;
}
</style>

<template>
  <div class="preview-content">
    <vue-office-excel
      :src="sourceUrl"
      style="height: calc(90vh - 48px); width: 100%"
      @rendered="renderedHandler"
      @error="errorHandler"
    />
  </div>
</template>
<script lang="ts" setup>
import VueOfficeExcel from '@vue-office/excel';
import '@vue-office/excel/lib/index.css';
import { inject } from 'vue';

const props = defineProps({
  sourceUrl: {
    type: String,
    required: true,
  },
});

const setPreLoading: (flag: boolean) => void = inject('setPreLoading');

function renderedHandler() {
  setPreLoading(false);
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
  width: 100%;
}
</style>

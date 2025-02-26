<template>
  <div class="chat-source">
    <component
      :is="currentComponent"
      :source-url="sourceUrl || ''"
      :text-content="textContent"
      :content="textContent"
      :class="sourceType === 'md' ? 'txt' : ''"
      :style="{ transform: `scale(${zoomLevel})` }"
    />
  </div>
</template>

<script setup lang="ts">
import PdfView from './PdfView.vue';
import ExcelView from './ExcelView.vue';
import DocxView from './DocxView.vue';
import PptView from './PptView.vue';
import TxtView from './TxtView.vue';
import ImageView from './ImageView.vue';
import HighLightMarkDown from '@/components/HighLightMarkDown.vue';
import { useChatSource } from '@/store/useChatSource';
import { inject } from 'vue';

const props = defineProps({
  zoomLevel: {
    type: Number,
    require: false,
    default: 1,
  },
  fileId: {
    type: String,
    require: true,
    default: '',
  },
});

const { zoomLevel } = toRefs(props);

const { sourceUrl, sourceType, textContent, preCacheData } =
  storeToRefs(useChatSource());

const setPreLoading: (value: boolean) => void = inject('setPreLoading');

const currentComponent = computed(() => {
  switch (sourceType.value) {
    case 'pdf':
      return PdfView;
    case 'docx':
    case 'doc':
      return DocxView;
    case 'xlsx':
    case 'xls':
      return ExcelView;
    case 'ppt':
    case 'pptx':
      return PptView;
    case 'jpg':
    case 'png':
    case 'jpeg':
      return ImageView;
    case 'txt':
    case 'csv':
    case 'eml':
    case 'jsonl':
      return TxtView;
    case 'md':
      return HighLightMarkDown;
    default:
      return null;
  }
});

//判断缓存是否命中
onMounted(() => {
  const cachedData = preCacheData.value.get(`preCache_${props.fileId}`);
  if (cachedData) {
    sourceUrl.value = cachedData.sourceUrl;
    sourceType.value = cachedData.sourceType;
    textContent.value = cachedData.textContent;
    setPreLoading(false);
  }
});

// 监听fileId变化，更新缓存
watch(
  () => props.fileId,
  (newFileId) => {
    const cachedData = preCacheData.value.get(`preCache_${newFileId}`);
    if (cachedData) {
      sourceUrl.value = cachedData.sourceUrl;
      sourceType.value = cachedData.sourceType;
      textContent.value = cachedData.textContent;
      setPreLoading(false);
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.chat-source {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  display: flex;

  & * {
    transition: transform 0.3s ease;
    transform-origin: 0 0;
  }

  &::-webkit-scrollbar {
    height: 10px !important;
  }

  .txt {
    width: 100%;
    height: auto;
    padding: 15px 20px 30px 20px;
  }

  :deep(.ant-image) {
    margin: 5px auto;
    max-width: 100%;
  }
}
</style>

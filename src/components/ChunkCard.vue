<template>
  <div class="card" @mouseenter="isHover = true" @mouseleave="isHover = false">
    <div class="card-header">
      <div class="card-title">
        <span><b>#</b> {{ chunk.id }} </span>
      </div>
      <div class="card-head-right">
        <div>
          <span class="select-desc"
            >{{ isSelected ? '导出已选中' : '导出未选中' }}
          </span>
        </div>
        <div
          class="select-icon"
          :class="isSelected ? 'select-icon-green' : 'select-icon-gray'"
        ></div>
        <div v-if="isHover">
          <a-switch :checked="isSelected" size="small" @click="toggleSelect" />
        </div>
      </div>
    </div>
    <div class="card-content" @click="handleModal">
      <HighLightMarkDown :content="chunk.content" />
      <span v-if="isHover" class="card-content-hover"></span>
      <div class="card-content-cover"></div>
    </div>
  </div>
  <ChunkCardModal
    :show-chunk-card-modal="showChunkCardModal"
    :chunk="chunk"
    @close-modal="closeModal"
  />
</template>

<script setup lang="ts">
import { Switch as ASwitch } from 'ant-design-vue';
import { ref, watch, defineProps, defineEmits } from 'vue';
import { IChunkData } from './ChunkViewDialog.vue';
import ChunkCardModal from './ChunkCardModal.vue';
import HighLightMarkDown from '@/components/HighLightMarkDown.vue';

const props = defineProps<{
  chunk: IChunkData;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (event: 'select', selectedChunk: IChunkData): void;
}>();

const showChunkCardModal = ref(false);
const isHover = ref(false);
const editableContent = ref(props.chunk.editContent);

const toggleSelect = () => emit('select', props.chunk);

const handleModal = () => {
  showChunkCardModal.value = true;
};

const closeModal = () => {
  showChunkCardModal.value = false;
};

watch(
  () => props.chunk.editContent,
  (newVal) => {
    editableContent.value = newVal;
  },
);
</script>

<style lang="scss" scoped>
.card {
  max-width: 375px;
  min-height: 150px;
  max-height: calc(1.4rem * 10);
  background-color: #f9fafb;
  border-radius: 12px;
  padding: 10px;
  border: 1px solid #fff;
  overflow: hidden;
  white-space: nowrap;
  &:hover {
    border: 1px solid #eaecf0;
    background-color: #fff;
    box-shadow: 0 10px 10px 0 rgba(0, 0, 0, 0.1);
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .card-head-right {
      display: flex;
      align-items: center;
      justify-content: center;
      .select-desc {
        color: #667085;
        font-size: 12px;
      }
      .select-icon {
        width: 6px;
        height: 6px;
        margin: 3px 10px 0 6px;
        border-radius: 50%;
      }
      .select-icon-green {
        background-color: #31c48d;
        border: 1px solid #0e9f6e;
      }
      .select-icon-gray {
        background-color: #d1d5db;
        border: 1px solid #6b7280;
      }
    }
    .card-title {
      color: #666666;
      padding: 0 6px;
      border-radius: 6px;
      border: 1px solid #eaecf0;
      font-size: 12px;
    }
  }
  .card-content {
    cursor: pointer;
    height: 100%;
    width: 100%;
    padding-top: 6px;
    position: relative;
    overflow: hidden;
    :deep(p),
    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9em;
      margin-bottom: 0.5em;
    }

    :deep(th),
    :deep(td) {
      border: 1px solid #e5e7eb;
      padding: 0.25em 0.5em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100px;
    }

    :deep(th) {
      background-color: #f3f4f6;
      font-weight: 600;
    }

    :deep(tr) {
      &:nth-child(even) {
        background-color: #f9fafb;
      }
    }
    .card-content-cover {
      margin-bottom: 16px;
      position: absolute;
      bottom: 0;
      left: 0;
      height: 10%;
      width: 100%;
      pointer-events: none;
      background: linear-gradient(180deg, transparent 0, white 100%);
      backdrop-filter: blur(0.5px);
      -webkit-backdrop-filter: blur(0.5px);
    }
    .card-content-hover {
      display: block;
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 80%;
      background: linear-gradient(180deg, transparent 0, white 100%);
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
  }
}
</style>

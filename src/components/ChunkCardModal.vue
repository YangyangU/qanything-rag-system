<template>
  <Teleport to="body">
    <a-config-provider :theme="{ token: { colorPrimary: '#5a47e5' } }">
      <a-modal
        v-model:open="showModal"
        class="card-content"
        style="top: 20px"
        :width="modalWidth"
        :cancel-text="common.cancel"
        :ok-text="common.save"
        :confirm-loading="isShowLoading"
        @cancel="cancel(chunk.key)"
        @ok="() => save(chunk.key)"
      >
        <div class="modal-edit">
          <a-button
            size="small"
            type="primary"
            @click="edit(chunk.key, isEditing)"
            >{{ isEditing ? common.cancel : common.edit }}</a-button
          >
        </div>
        <div class="modal-content" style="width: auto">
          <div v-if="isEditing">
            <a-textarea
              v-if="editableData[chunk.key]"
              v-model:value="editableData[chunk.key]['editContent']"
              class="edit-textarea"
              show-count
              auto-size
            />
            <div
              v-else
              class="edit-textarea"
              v-html="formattedContent(chunk.content)"
            />
          </div>
          <HighLightMarkDown
            v-else
            class="edit-textarea"
            :content="
              editableData[chunk.key]
                ? editableData[chunk.key].editContent
                : chunk.content
            "
          />
        </div>
      </a-modal>
    </a-config-provider>
  </Teleport>
</template>

<script setup lang="ts">
import HighLightMarkDown from '@/components/HighLightMarkDown.vue';
import {
  Button as AButton,
  Textarea as ATextarea,
  Modal as AModal,
  message,
} from 'ant-design-vue';
import { useChatSetting } from '@/store/useChatSetting';
import urlResquest from '@/services/urlConfig';
import { resultControl } from '@/utils/utils';
import { getLanguage } from '@/language';
import { IChunkData } from './ChunkViewDialog.vue';

const { chatSettingFormActive } = storeToRefs(useChatSetting());
const { common } = getLanguage();

const props = defineProps({
  chunk: {
    type: Object,
    required: true,
  },
  showChunkCardModal: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits<{
  (event: 'close-modal'): void;
}>();

const showModal = ref(props.showChunkCardModal);
const isEditing = ref(false);
const editableData = ref<Record<string, IChunkData>>({});
const isShowLoading = ref(false);
const abortController = ref<AbortController | null>(null);
const modalWidth = ref('50vw');

// 动态判断弹窗宽度
onUpdated(() => {
  nextTick(() => {
    const textAreas = document.querySelectorAll('.edit-textarea');
    textAreas.forEach((el: HTMLElement) => {
      const table = el.querySelector('table');
      if (table) {
        const tableWidth = table.offsetWidth;
        const containerWidth = window.innerWidth * 0.5;

        if (tableWidth > containerWidth) {
          modalWidth.value = `${tableWidth + 50}px`;
        } else {
          modalWidth.value = '50vw';
        }
      } else {
        modalWidth.value = '50vw';
      }
    });
  });
});

watch(
  () => props.showChunkCardModal,
  (newVal) => (showModal.value = newVal),
);

const closeModal = () => {
  emit('close-modal');
};

//编辑 | 取消
const edit = (key: string, operate: boolean) => {
  if (!operate) {
    isEditing.value = true;
    editableData.value[key] = JSON.parse(JSON.stringify(props.chunk));
  } else {
    isEditing.value = false;
    if (editableData.value[key]) delete editableData.value[key];
  }
};

//保存
const save = async (key: string) => {
  //如果没改动则退出
  if (
    !isEditing.value ||
    editableData.value[key].editContent === props.chunk.editContent
  ) {
    isEditing.value = false;
    closeModal();
    return;
  }
  isShowLoading.value = true;

  const loadingMessage = message.loading('保存中...', 0);
  // 用于取消请求
  abortController.value = new AbortController();
  const signal = abortController.value.signal;

  try {
    await resultControl(
      await urlResquest.updateDocCompleted(
        {
          chunk_size: chatSettingFormActive.value.chunkSize,
          doc_id: key,
          update_content: editableData.value[key].editContent,
        },
        { signal },
      ),
    );
    message.success('修改成功');
    isEditing.value = false;
    editableData.value[key].content = editableData.value[key].editContent;
    Object.assign(props.chunk, editableData.value[key]);
    delete editableData.value[key];
  } catch (e) {
    if (e.name === 'AbortError') {
      message.info('请求已取消');
    } else {
      message.error(e.msg);
    }
  } finally {
    isShowLoading.value = false;
    closeModal();
    loadingMessage();
  }
};

//取消
const cancel = (key: string) => {
  isEditing.value = false;
  closeModal();
  if (editableData.value[key]) delete editableData.value[key];

  //取消保存请求
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
};

// 分析结果的换行
const formattedContent = (str) => {
  return str.replace(/\n/g, '<br />');
};
</script>

<style lang="scss" scoped>
.card-content {
  position: relative;
  .modal-edit {
    position: absolute;
    right: 4rem;
    top: 15px;
  }
  .modal-content {
    min-width: 40vw;
    overflow: scroll;
    .edit-textarea {
      margin: 25px 0;
    }
  }
}
:deep(table) {
  margin-bottom: 0.5em;
}

:deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.25em 0.5em;
}

:deep(th) {
  border-bottom: none !important;
  background-color: #f3f4f6 !important;
  white-space: nowrap;
  width: auto;
  min-width: 100px;
  border-bottom: none;
  padding: 20px 10px !important;
  font-weight: 600;
  font-size: 16px;
}

:deep(tr) {
  text-align: center;
  &:nth-child(even) {
    background-color: #f9fafb;
  }
}
::-webkit-scrollbar-thumb {
  background-color: #a8aaad !important;
}
</style>

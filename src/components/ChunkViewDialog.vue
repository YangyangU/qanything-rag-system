<!--
 * @Author: Ianarua 306781523@qq.com
 * @Date: 2024-07-26 14:08:46
 * @LastEditors: Ianarua 306781523@qq.com
 * @LastEditTime: 2024-08-06 10:30:12
 * @FilePath: front_end/src/components/ChunkViewDialog.vue
 * @Description: 上传文件解析结果切片的弹窗
 -->
<template>
  <Teleport to="body">
    <a-config-provider :theme="{ token: { colorPrimary: '#5a47e5' } }">
      <a-modal
        v-model:open="showChunkModel"
        title="切片分析结果"
        centered
        width="100%"
        wrap-class-name="chunk-modal"
        destroy-on-close
        :footer="null"
        @cancel="handleCancel"
      >
        <div class="container">
          <div
            class="file-preview"
            :style="{ width: filePreviewWidth }"
            @mousedown="onMouseDown"
          >
            <!-- 暂时隐藏分页器 -->
            <div
              class="preview-header"
              :style="
                previewPaginationConfig.total > 1
                  ? {}
                  : { justifyContent: 'end' }
              "
            >
              <a-pagination
                v-if="previewPaginationConfig.total > 1"
                :total="previewPaginationConfig.total"
                :current="previewPaginationConfig.pageNum"
                :page-size="previewPaginationConfig.pageSize"
                :show-total="previewPaginationConfig.showTotal"
                :show-size-changer="previewPaginationConfig.showSizeChanger"
                simple
                @change="previewChangePage"
              />
              <div class="scale">
                <a-button
                  shape="circle"
                  :icon="h(PlusCircleOutlined)"
                  @click="enlargeHandle"
                />
                <span class="scale-text"
                  >{{ (zoomLevel * 100).toFixed(0) }}%</span
                >
                <a-button
                  shape="circle"
                  :icon="h(MinusCircleOutlined)"
                  @click="narrowHandle"
                />
              </div>
            </div>
            <div
              ref="filePreviewRef"
              class="file-preview-content"
              @scroll="handleScroll"
            >
              <Source
                v-show="!preLoading"
                :file-id="props.fileId"
                :zoom-level="zoomLevel"
              />
              <LoadingImg v-if="preLoading" class="loading-img" />
            </div>
            <div class="resize-handle"></div>
          </div>
          <div ref="tableDomRef" class="chunk-table">
            <div class="export">
              <a-tooltip color="#fff" placement="bottom">
                <template #title>
                  <span style="color: #666; user-select: text">{{
                    filePath
                  }}</span>
                </template>
                <span class="file-path"
                  >文件与解析结果所在目录: {{ filePath }}</span
                >
              </a-tooltip>
              <div
                class="all-select"
                @mouseenter="isHover = true"
                @mouseleave="isHover = false"
              >
                <div>
                  <span class="select-desc"> 本页全选 </span>
                </div>
                <div
                  class="select-icon"
                  :class="
                    isPageAllSelected(chunkData)
                      ? 'select-icon-green'
                      : 'select-icon-gray'
                  "
                ></div>
                <div v-if="isHover">
                  <a-switch
                    :checked="isPageAllSelected(chunkData)"
                    size="small"
                    @click="onSelectAll(chunkData)"
                  />
                </div>
              </div>
              <a-button type="primary" @click="exportSelected">
                导出选中({{ selectedKeys.size }})
              </a-button>
            </div>
            <!--            x: tableDomWidth,-->
            <div class="card-container">
              <div v-if="!loading" class="chunk-cards">
                <ChunkCard
                  v-for="chunk in chunkData"
                  :key="chunk.key"
                  :chunk="chunk"
                  :is-selected="selectedKeys.has(chunk.key)"
                  @select="onSelect"
                />
              </div>
              <LoadingImg v-else class="loading-img" />
            </div>
            <div class="chunk-pagination">
              <a-pagination
                :total="chunkPaginationConfig.total"
                :current="chunkPaginationConfig.pageNum"
                :page-size="chunkPaginationConfig.pageSize"
                :show-total="chunkPaginationConfig.showTotal"
                :show-size-changer="chunkPaginationConfig.showSizeChanger"
                @change="chunkChangePage"
              />
            </div>
          </div>
        </div>
        <div class="footer">
          <a-button type="primary" @click="handleCancel">{{
            common.close
          }}</a-button>
        </div>
      </a-modal>
    </a-config-provider>
  </Teleport>
</template>

<script setup lang="ts">
import { h, provide } from 'vue';
import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons-vue';
import { useChunkView } from '@/store/useChunkView';
import { getLanguage } from '@/language';
import { downLoad, resultControl } from '@/utils/utils';
import urlResquest from '@/services/urlConfig';
import { message } from 'ant-design-vue';
import { useChatSource } from '@/store/useChatSource';
import Source from './Source/index.vue';
import { getB64Type, supportSourceTypes } from '@/utils/getB64type';
import LoadingImg from '@/components/LoadingImg.vue';
import { useScroll } from '@vueuse/core';

const { showChunkModel, chunkCacheData } = storeToRefs(useChunkView());
const { common } = getLanguage();

const { setSourceType, setSourceUrl, setTextContent } = useChatSource();
const { preCacheData } = storeToRefs(useChatSource());

interface IProps {
  kbId: string;
  fileId: string;
  fileName: string;
}

const props = defineProps<IProps>();
const { kbId, fileId, fileName } = toRefs(props);

export interface IChunkData {
  // 切片唯一标识符 -> chunk_id
  key: string;
  // 显示的id
  id: number;
  // markdown内容
  content: string;
  // 编辑内容
  editContent: string;
}

// 整体加载的loading
const loading = ref(true);
// 预览loading
const preLoading = ref(true);
// 监听子组件渲染完成事件
provide('setPreLoading', (value) => {
  preLoading.value = value;
});

// 多选
const selectedKeys = ref<Map<string, string>>(new Map());
// 鼠标移至全选
const isHover = ref(false);
// 横向滚动条居中
const filePreviewRef = ref<HTMLElement | null>(null);

//判断当前页是否全选
const isPageAllSelected = (pageData: IChunkData[]) => {
  return pageData.every((chunk) => selectedKeys.value.has(chunk.key));
};

// 点击多选框
const onSelect = (selectedChunk: IChunkData) => {
  const key = selectedChunk.key;
  const content = selectedChunk.content;
  if (selectedKeys.value.has(key)) {
    selectedKeys.value.delete(key);
  } else {
    selectedKeys.value.set(key, content);
  }
};

// 点击全选框
const onSelectAll = (pageData: IChunkData[]) => {
  pageData.forEach((item) => {
    const { key, content } = item;
    if (selectedKeys.value.has(key)) {
      selectedKeys.value.delete(key);
    } else {
      selectedKeys.value.set(key, content);
    }
  });
};

// 导出按钮
const exportSelected = () => {
  let str = '';
  const contentArr = [...selectedKeys.value.values()];
  contentArr.map((item) => {
    str += item + '\n\n';
  });
  beforeDownload(str);
};

const beforeDownload = (content) => {
  try {
    const fileName = 'output.txt';
    const resFile = new File([content], fileName, {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(resFile);
    downLoad(url, fileName);
    selectedKeys.value.clear();
  } catch (e) {
    message.error('download error');
  }
};

// 预览分页参数
const previewPaginationConfig = ref({
  pageNum: 1,
  pageSize: 1,
  total: 0,
  showSizeChanger: false,
  showTotal: (total) => `共 ${total} 页`,
});

provide('setTotal', (value) => {
  previewPaginationConfig.value.total = value;
});

const previewChangePage = (pageNumber: number) => {
  previewPaginationConfig.value.pageNum = pageNumber;
  scrollToCanvas(pageNumber);
};

// 预览分页滚动
const scrollToCanvas = (pageNumber: number) => {
  const filePreviewContent = filePreviewRef.value;
  const canvasElement = filePreviewContent.querySelector(
    `.vue-office-pdf-wrapper [data-page="${pageNumber}"]`,
  );

  if (canvasElement) {
    const { top } = canvasElement.getBoundingClientRect();
    const { top: parentTop } = filePreviewContent.getBoundingClientRect();
    const scrollPosition = top - parentTop + filePreviewContent.scrollTop;
    filePreviewContent.scrollTo({ top: scrollPosition, behavior: 'smooth' });
  }
};

// 监听滚动映射页码
const handleScroll = () => {
  const filePreviewContent = filePreviewRef.value;
  const canvases = filePreviewContent.querySelectorAll(
    '.vue-office-pdf-wrapper canvas',
  );
  const parentTop = filePreviewContent.getBoundingClientRect().top;
  let currentPage = 1;

  // 元素的的top与父元素的top齐平才设置页码
  canvases.forEach((canvas, index) => {
    const { top } = canvas.getBoundingClientRect();
    if (Math.abs(top - parentTop) < 1) {
      currentPage = index + 1;
    }
  });

  if (previewPaginationConfig.value.pageNum !== currentPage) {
    previewPaginationConfig.value.pageNum = currentPage;
  }
};

// 自适应子元素宽度
const resizePreview = () => {
  const chatSourceElement = document.querySelector(
    '.preview-content',
  ) as HTMLElement;
  console.log('chatSourceElement', chatSourceElement);
  if (chatSourceElement) {
    const chatSourceWidth = chatSourceElement.offsetWidth;
    setNewWidth(chatSourceWidth);
  }
};

provide('resizePreview', resizePreview);

// chunk分页参数
const chunkPaginationConfig = ref({
  pageNum: 1, // 当前页码
  pageSize: 24, // 每页条数
  total: 0, // 数据总数
  showSizeChanger: false,
  showTotal: (total) => `共 ${total} 条`,
});

// 分页点击
const chunkChangePage = (pageNumber: number) => {
  chunkPaginationConfig.value.pageNum = pageNumber;
  getChunks(kbId.value, fileId.value);
};

// 数据
const chunkData = ref<IChunkData[]>([]);
const chunkId = ref(1);
const filePath = ref('');

const handleCancel = () => {
  showChunkModel.value = false;
};

// 预览的放大缩小
const zoomLevel = ref(1);
const enlargeHandle = () => {
  zoomLevel.value += 0.1;
};
const narrowHandle = () => {
  // 0.15方便精度计算
  if (zoomLevel.value <= 0.15) return;
  zoomLevel.value -= 0.1;
};

// 获取切片
const getChunks = async (kbId: string, fileId: string) => {
  const chunkCacheKey = `chunkCache_${props.fileId}`;
  loading.value = true;

  // 只缓存第一页
  if (
    chunkPaginationConfig.value.pageNum === 1 &&
    chunkCacheData &&
    chunkCacheData.value
  ) {
    const temp = chunkCacheData.value.get(chunkCacheKey);
    if (temp) {
      chunkData.value = temp.data;
      chunkPaginationConfig.value.total = temp.total;
      loading.value = false;
      return;
    }
  }
  try {
    const res = (await resultControl(
      await urlResquest.getDocCompleted({
        kb_id: kbId,
        file_id: fileId,
        page_id: chunkPaginationConfig.value.pageNum,
        page_limit: chunkPaginationConfig.value.pageSize,
      }),
    )) as any;
    chunkId.value =
      (chunkPaginationConfig.value.pageNum - 1) *
        chunkPaginationConfig.value.pageSize +
      1;
    chunkPaginationConfig.value.total = res.total_count;
    chunkData.value = [];
    filePath.value = res.file_path;
    res.chunks.forEach((item: any) => {
      chunkData.value.push({
        key: item.chunk_id,
        id: chunkId.value++,
        content: item.page_content,
        editContent: item.page_content,
      });
    });
    // 缓存新的数据
    if (chunkPaginationConfig.value.pageNum === 1) {
      const cacheValue = {
        data: [...chunkData.value],
        total: res.total_count,
      };
      chunkCacheData.value.set(chunkCacheKey, cacheValue);
    }
  } catch (e) {
    message.error(e.msg || '获取文档解析结果失败');
  } finally {
    loading.value = false;
  }
};

watch(
  () => showChunkModel.value,
  async (isVisible) => {
    if (isVisible) {
      chunkData.value = [];
      await getChunks(kbId.value, fileId.value);
      handleChatSource({ file_id: fileId.value, file_name: fileName.value });
    } else {
      resetModalState();
    }
  },
);

// 重置状态
const resetModalState = () => {
  zoomLevel.value = 1;
  chunkData.value = [];
  chunkId.value = 1;
  chunkPaginationConfig.value.pageNum = 1;
  chunkPaginationConfig.value.total = 1;
  setSourceUrl('');
  setTextContent('');
  selectedKeys.value.clear();
  preLoading.value = true;
  loading.value = true;
  previewPaginationConfig.value.pageNum = 1;
  previewPaginationConfig.value.total = 1;
};

const checkFileType = (filename) => {
  if (!filename) {
    return false;
  }
  const arr = filename.split('.');
  if (arr.length) {
    const suffix = arr.pop();
    if (supportSourceTypes.includes(suffix)) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

const handleChatSource = (file) => {
  const isSupport = checkFileType(file.file_name);
  if (isSupport) {
    queryFile(file);
  }
};

async function queryFile(file) {
  try {
    setSourceUrl(null);
    const res: any = await resultControl(
      await urlResquest.getFile({ file_id: file.file_id }),
    );
    const suffix = file.file_name.split('.').pop();
    const b64Type = getB64Type(suffix);
    setSourceType(suffix);
    setSourceUrl(`data:${b64Type};base64,${res.file_base64}`);
    //预览缓存
    const preCacheValue = {
      sourceUrl: `data:${b64Type};base64,${res.file_base64}`,
      sourceType: suffix,
    };
    if (
      suffix === 'txt' ||
      suffix === 'md' ||
      suffix === 'csv' ||
      suffix === 'eml' ||
      suffix === 'jsonl'
    ) {
      const decodedTxt = atob(res.file_base64);
      const correctStr = decodeURIComponent(escape(decodedTxt));
      setTextContent(correctStr);
      preCacheValue['textContent'] = correctStr;
    }
    preCacheData.value.set(`preCache_${file.file_id}`, preCacheValue);
  } catch (e) {
    message.error(e.msg || '获取文件失败');
  }
}

// 预览拖动相关
const isResizing = ref(false);
const initialX = ref(0);
const initialWidth = ref(0);
const filePreviewWidth = ref('40%');

const setNewWidth = (newWidth) => {
  const widthRules = {
    min: 300,
  };
  // 最小值
  if (newWidth >= widthRules.min) {
    filePreviewWidth.value = `${newWidth}px`;
  }
};

const onMouseDown = (event) => {
  // 检查鼠标按下的元素是否是拖动手柄
  if (event.target.classList.contains('resize-handle')) {
    isResizing.value = true;
    initialX.value = event.clientX;
    initialWidth.value = event.target.parentElement.offsetWidth;

    // 监听全局的鼠标移动和松开事件
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
};

const onMouseMove = (event) => {
  if (isResizing.value) {
    const deltaX = event.clientX - initialX.value;
    const newWidth = initialWidth.value + deltaX;
    // 设置新的宽度
    setNewWidth(newWidth);
  }
};

const onMouseUp = () => {
  if (isResizing.value) {
    isResizing.value = false;
    // 移除监听器
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }
};

// 滚动到中间
const setScrollToCenter: () => void = () => {
  const contentRef = filePreviewRef.value;
  if (contentRef) {
    const scrollWidth = contentRef.scrollWidth;
    const clientWidth = contentRef.clientWidth;
    const centerPosition = (scrollWidth - clientWidth) / 2;
    contentRef.scrollLeft = centerPosition;
  }
};
// 传给预览组件
provide('setScrollToCenter', setScrollToCenter);

// 滚动显示滚动条

const { x, y } = useScroll(filePreviewRef);
let scrollTimer = null;

watch([x, y], ([newX, newY], [oldX, oldY]) => {
  // 当 y 发生变化而 x 不变时，判断为纵向滚动
  if (newY !== oldY && newX === oldX) {
    filePreviewRef.value.classList.add('scrolling');
  }
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    filePreviewRef.value.classList.remove('scrolling');
  }, 500);
});

onUnmounted(() => {
  if (scrollTimer) clearTimeout(scrollTimer);
});
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  width: 100%;
  height: calc(100% - 42px - 20px);

  .file-preview {
    position: relative;
    width: 40%;
    height: 100%;
    display: flex;
    flex-direction: column;
    //padding: 0 10px;

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;

      .scale {
        display: flex;
        justify-content: flex-end;
        border-radius: 18px;

        .scale-text {
          width: 40px;
          height: 32px;
          padding: 0 5px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      }
    }

    .file-preview-content {
      position: relative;
      width: 100%;
      height: 100%;
      border: 1px #d9d9d9 solid;
      padding-right: 0;
      padding-bottom: 8px;
      //border-right: 0;
      border-radius: 12px;
      overflow-x: auto;
      box-sizing: border-box;

      &::-webkit-scrollbar {
        //width: 0;
        height: 12px;
      }

      .loading-img {
        width: 50px;
        height: 50px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }

  .resize-handle {
    position: absolute !important;
    //top: 50%;
    bottom: 0;
    right: 0 !important;
    width: 1px;
    height: calc(100% - 44px);
    transform: translateY(-6px);
    cursor: ew-resize;
    background-color: #eee;
    user-select: none;
    z-index: 999;

    &:hover {
      width: 2px;
      background-color: #ccc;
    }
  }

  .chunk-table {
    flex: 1;
    min-width: 600px;
    height: 100%;
    margin-left: 10px;
    overflow: hidden;

    .export {
      width: 100%;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .file-path {
        flex: 1;
        padding: 0 10px;
        margin-right: 20px;
        font-size: 14px;
        font-weight: 400;
        color: #999;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .all-select {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
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
    }
    .card-container {
      width: 100%;
      height: 100%;
      overflow: scroll;
      position: relative;
      .loading-img {
        width: 50px;
        height: 50px;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
    }
    .chunk-cards {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      position: relative;
      margin-bottom: 50px;
    }
    .chunk-pagination {
      position: absolute;
      bottom: 50px;
      left: -130px;
      width: 100%;
      display: flex;
      justify-content: end;
      align-items: center;
    }
    :deep(.ant-table-cell) {
      vertical-align: top;
    }

    :deep(.ant-table-body) {
      &::-webkit-scrollbar {
        height: 12px;
      }
    }

    :deep(.ant-table-wrapper),
    :deep(.ant-spin-nested-loading),
    :deep(.ant-spin-container) {
      height: 100%;
    }

    :deep(.ant-table) {
      min-height: calc(100% - 64px - 42px);
    }

    :deep(.ant-table-cell[colstart='3']) {
      min-width: 150px !important;
    }
  }
}

:deep(.file-preview-content.scrolling::-webkit-scrollbar-thumb) {
  background: #a8aaad !important;
}
:deep(.file-preview-content.scrolling::-webkit-scrollbar) {
  height: 0 !important;
}
:deep(.vue-office-docx) {
  overflow-y: unset !important;
}
.footer {
  width: 100%;
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.editable-row-operations {
  width: 100%;
  height: 100%;

  .operation-div {
    display: flex;
    justify-content: space-evenly;
    align-items: center;

    .operation-btn {
      padding: 0;
    }
  }

  a {
    margin-right: 8px;
  }
}
</style>

<template>
  <div ref="botDetailEditComp" class="bot-detail-edit-comp">
    <div class="name-avatar">
      <img src="@/assets/bots/bot-avatar.png" alt="avatar" />
      <a-input
        v-model:value="name"
        :placeholder="bots.inputBotName"
        show-count
        :maxlength="25"
      />
    </div>
    <div class="title">{{ bots.roleSetting }}</div>
    <a-dropdown
      :trigger="['click']"
      :get-popup-container="() => botDetailEditComp"
    >
      <a-textarea
        v-model:value="roleSetting"
        :placeholder="bots.roleSetPlaceholder"
        class="role-setting-input"
        :auto-size="{ minRows: 7, maxRows: 7 }"
        :rows="7"
        @click.prevent
      />
      <template #overlay>
        <a-menu>
          <a-menu-item>
            <a
              href="javascript:;"
              @click="roleSetting = bots.roleSetPlaceholder"
              >预设一</a
            >
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    <TextCountLimit :content="roleSetting" :limit="2000" />
    <div class="title">{{ bots.welcomeMessage }}</div>
    <a-dropdown
      :trigger="['click']"
      :get-popup-container="() => botDetailEditComp"
    >
      <a-textarea
        v-model:value="welcomeMessage"
        class="greeting-input"
        show-count
        :maxlength="100"
        :placeholder="bots.inputWelcomMsg"
        :auto-size="{ minRows: 6, maxRows: 6 }"
        :rows="6"
      />
      <template #overlay>
        <a-menu>
          <a-menu-item>
            <a
              href="javascript:;"
              @click="welcomeMessage = bots.welcomeMsgPlaceholder"
              >预设一</a
            >
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    <div class="title">{{ bots.associatedKb }}<span>*</span></div>
    <div
      v-for="(item, index) in curBot.kb_ids"
      :key="item"
      class="knowedge-item knowledge-info"
    >
      <img
        class="knowledge-icon"
        src="@/assets/bots/knowledge.png"
        alt="knowledge"
      />
      <div class="kb-name">{{ curBot.kb_names[index] }}</div>
      <img
        class="remove-icon"
        src="@/assets/bots/remove.png"
        alt="remove"
        @click="removeKb(item)"
      />
    </div>
    <div
      class="knowedge-item add-knowledge-content"
      @click="setSelectKnowledgeVisible(true)"
    >
      <img
        class="add-knowedge"
        src="@/assets/bots/add-knowedge.png"
        alt="icon"
      />
      {{ bots.clickAssociatedKb }}
    </div>
    <!--    <div class="save">-->
    <!--      <a-button class="save-btn" type="primary" @click="saveBotInfo">{{ bots.save }}</a-button>-->
    <!--    </div>-->
    <div class="title">{{ common.modelSettingTitle }}</div>
    <ChatSettingForm
      ref="chatSettingFormRef"
      :context-length="QA_List.length"
    />
    <div class="chat-setting-form-footer">
      <a-button type="primary" style="width: auto" @click="handleOk">
        {{ common.confirmApplication }}
      </a-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useBots } from '@/store/useBots';
import urlResquest from '@/services/urlConfig';
import { resultControl } from '@/utils/utils';
import { message } from 'ant-design-vue';
import { getLanguage } from '@/language/index';
import ChatSettingForm from '@/components/ChatSettingForm.vue';
import { useBotsChat } from '@/store/useBotsChat';
import { IChatSetting } from '@/utils/types';

const { curBot, knowledgeList } = storeToRefs(useBots());
const { QA_List } = storeToRefs(useBotsChat());
const { setSelectKnowledgeVisible, setCurBot } = useBots();

const { bots, common } = getLanguage();

const name = ref('');
const roleSetting = ref('');
const welcomeMessage = ref('');
const botDetailEditComp = ref<HTMLDivElement | null>(null);
const chatSettingFormRef = ref<InstanceType<typeof ChatSettingForm>>();
const botId = ref<string | null>(null);

onMounted(async () => {
  name.value = curBot.value.bot_name;
  welcomeMessage.value =
    curBot.value.welcome_message || bots.welcomeMsgPlaceholder; //如果是空，则默认为预设一
  roleSetting.value = curBot.value.prompt_setting;

  // 如果是bots应该先从后端拿取配置，然后填充到表单中
  botId.value = window.location.hash.split('/')[2];
  if (botId.value) {
    try {
      if (chatSettingFormRef.value) {
        const initSetting = await getBotInfo(botId.value);
        console.log(initSetting);
        const temp: typeof initSetting = {
          apiBase: initSetting.api_base,
          apiContextLength: initSetting.api_context_length,
          apiKey: initSetting.api_key,
          apiModelName: initSetting.model,
          capabilities: {
            networkSearch: initSetting.networking,
            mixedSearch: initSetting.hybrid_search,
            onlySearch: initSetting.only_need_search_results,
            rerank: initSetting.rerank,
          },
          chunkSize: initSetting.chunk_size,
          context: initSetting.context_message_limit,
          maxToken: initSetting.max_token,
          modelType: initSetting.model_type,
          rerankScoreThreshold: initSetting.rerank_score_threshold,
          temperature: initSetting.temperature,
          top_K: initSetting.top_k,
          top_P: initSetting.top_p,
        };
        chatSettingFormRef.value.initForm(temp);
      }
    } catch (error) {
      console.error('Error fetching bot info:', error);
    }
  }
});

const getBotInfo = async (botId) => {
  try {
    const res: any = await resultControl(
      await urlResquest.queryBotInfo({ bot_id: botId }),
    );
    setCurBot(res[0]);
    return JSON.parse((res[0] as any).llm_setting);
  } catch (e) {
    message.error(e.msg || '获取Bot信息失败');
  }
};

// 校验角色设定字数
const validate = () => {
  if (roleSetting.value.length > 2000) {
    message.error(bots.charLimit);
    return false;
  }
  return true;
};

const saveBotInfo = async (setting: IChatSetting) => {
  try {
    await resultControl(
      await urlResquest.updateBot({
        bot_id: botId.value,
        bot_name: name.value,
        prompt_setting: roleSetting.value,
        welcome_message: welcomeMessage.value,
        only_need_search_results: setting.capabilities.onlySearch,
        networking: setting.capabilities.networkSearch,
        api_base: setting.apiBase,
        api_key: setting.apiKey,
        api_context_length: setting.apiContextLength,
        top_p: setting.top_P,
        temperature: setting.temperature,
        top_k: setting.top_K,
        model: setting.apiModelName,
        max_token: setting.maxToken,
        hybrid_search: setting.capabilities.mixedSearch,
        chunk_size: setting.chunkSize,
        rerank: setting.capabilities.rerank,
        rerank_score_threshold: setting.rerankScoreThreshold,
        model_type: setting.modelType,
        context_message_limit: setting.context,
      }),
    );
  } catch (e) {
    console.log('error--', e);
    message.error(e.msg || '保存失败，请重试');
  }
};

const removeKb = async (data) => {
  let kbIds = curBot.value.kb_ids;
  console.log('removeKb', data, kbIds);
  kbIds = kbIds.filter((item) => item != data);
  try {
    await resultControl(
      await urlResquest.updateBot({
        bot_id: curBot.value.bot_id,
        kb_ids: kbIds,
      }),
    );
    getBotInfo(curBot.value.bot_id);
    knowledgeList.value = knowledgeList.value.map((item) => {
      if (item.kb_id === data) {
        item.state = item.state === 0 ? 1 : 0;
      }
      return item;
    });
    message.success(bots.removalSucessful);
  } catch (e) {
    message.error(e.msg || '请求失败');
  }
};

// 模型设置
const handleOk = async (_, msg = '应用成功') => {
  if (!validate()) return;
  const checkRes = await chatSettingFormRef.value.onCheck();
  if (!Object.hasOwn(checkRes, 'errorFields')) {
    try {
      console.log('checkRes', checkRes);
      await saveBotInfo(checkRes);
      getBotInfo(botId.value);
      message.success(msg);
    } catch (error) {
      message.error(error.msg || '保存失败，请重试');
    }
    return true;
  }
  return false;
};

defineExpose({ handleOk });
</script>
<style lang="scss" scoped>
.bot-detail-edit-comp {
  width: calc(58% - 20px);
  height: calc(100% - 22px);
  padding: 26px;
  background: #fff;
  overflow: auto;
  position: relative;

  .name-avatar {
    width: 100%;
    height: 56px;
    display: flex;
    align-items: center;

    img {
      width: 56px;
      height: 56px;
      margin-right: 16px;
    }

    .ant-input-affix-wrapper {
      height: 40px;
    }
  }

  .title {
    font-size: 16px;
    font-weight: 500;
    color: #222222;
    margin-top: 24px;
    margin-bottom: 12px;

    span {
      color: #ff0000;
    }
  }

  .save {
    width: 100%;
    margin-top: 22px;
    display: flex;
    justify-content: end;

    .save-btn {
      width: 68px;
      height: 32px;
      font-size: 14px;
      background: #5a47e5 !important;
      margin-top: 5px;
    }
  }

  .model-select {
    height: 40px;
    margin: 24px 0;
    display: flex;
    align-items: center;

    .model-title {
      margin: 0 28px 0 0;
    }

    .model-list {
      border-radius: 8px;
      font-size: 14px;
      display: flex;

      .model-item {
        height: 40px;
        width: 120px;
        text-align: center;
        line-height: 40px;
        box-sizing: border-box;
        border: 1px solid #ededed;
        cursor: pointer;

        &:first-child {
          border-radius: 8px 0 0 8px;
        }

        &:last-child {
          border-radius: 0 8px 8px 0;
        }
      }

      .model-item-active {
        color: #5a47e5;
        border: 1px solid #5a47e5;
        background: #eeecfc;
        font-weight: 500;
      }
    }
  }

  .knowedge-item {
    width: 100%;
    height: 56px;
    border-radius: 8px;
    background: #f9f9fc;
    font-size: 14px;
    padding: 0 20px;
    margin-top: 12px;
    display: flex;
    align-items: center;
  }

  .add-knowledge-content {
    justify-content: center;
    color: #999999;
    cursor: pointer;

    .add-knowedge {
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }
  }

  .knowledge-info {
    display: flex;
    align-items: center;

    .knowledge-icon {
      width: 32px;
      height: 32px;
      margin-right: 12px;
    }

    .kb-name {
      flex-grow: 1;
      color: #222222;
    }

    .remove-icon {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
  }

  .role-setting-input {
    overflow: auto !important;
  }

  .chat-setting-form-footer {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
<style lang="scss">
.bot-detail-edit-comp {
  .ant-input {
    color: #666666 !important;
  }
}
</style>

<template>
  <div class="txt">{{ textContent }}</div>
</template>

<script setup lang="ts">
defineProps({
  textContent: {
    type: String,
    default: '',
  },
});
</script>

<style lang="scss" scoped>
.txt {
  width: 100%;
  height: auto;
  padding: 15px 20px 30px 20px;
  white-space: 'pre-wrap';
}
</style>

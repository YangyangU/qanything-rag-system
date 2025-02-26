<template>
  <div
    :class="[
      'role-setting-length',
      matches && matches.length > limit ? 'over-length' : '',
    ]"
  >
    {{ matches ? matches.length : 0 }} / {{ limit }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  content: string;
  limit: number;
}>();
const matches: any = computed(() =>
  props.content.match(/[^a-zA-Z\s]|\p{P}|\w+/gu),
);
</script>

<style lang="scss" scoped>
.role-setting-length {
  font-size: 13px;
  width: 100%;
  color: rgba(0, 0, 0, 0.45);
  text-align: end;
}

.over-length {
  color: #ff0000;
  font-size: 13px;
}
</style>

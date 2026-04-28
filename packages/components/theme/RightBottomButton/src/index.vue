<script setup lang="ts" name="RightBottomButton">
import type { BackTop, ThemeEnhance } from "@teek/config";
import { computed } from "vue";
import { useTeekConfig } from "@teek/components/theme/ConfigProvider";
import { mobileMaxWidthMedia } from "@teek/components/theme/ThemeEnhance";
import { useMediaQuery } from "@teek/composables";
import { ns } from "./namespace";
import BackTopComponent from "./BackTop.vue";
import ThemeColorComponent from "./ThemeColor.vue";

defineOptions({ name: "RightBottomButton" });

const { getTeekConfigRef } = useTeekConfig();
const backTopConfig = getTeekConfigRef<BackTop>("backTop", { enabled: true });
const themeEnhanceConfig = getTeekConfigRef<ThemeEnhance>("themeEnhance", { enabled: true });

const isMobile = useMediaQuery(mobileMaxWidthMedia);
const disabledThemeColor = computed(() => {
  const { enabled = true, themeColor = {}, position = "top" } = themeEnhanceConfig.value;
  const isDisabled = themeColor.disabled ?? themeColor.disabledInMobile;

  // 如果全局禁用主题增强功能，则禁用主题颜色，其次判断是否局部禁用主题颜色功能，最后默认移动端启用主题颜色功能
  if (!enabled) return true;
  if (isDisabled !== undefined) return isDisabled;
  return !isMobile.value && position === "top";
});
</script>

<template>
  <div :class="[ns.b(), ns.join('wallpaper-outside'), 'flx-column']">
    <slot name="teek-right-bottom-before" />

    <BackTopComponent v-if="backTopConfig.enabled">
      <template #default="scope">
        <slot name="teek-back-top" v-bind="scope" />
      </template>
    </BackTopComponent>

    <ThemeColorComponent v-if="!disabledThemeColor" />

    <slot name="teek-right-bottom-after" />
  </div>
</template>

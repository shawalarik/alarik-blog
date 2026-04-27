<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const visible = ref(false);
const refreshedAt = ref("");

let timer = 0;

const subtitle = computed(() => (refreshedAt.value ? `${refreshedAt.value} 已重新载入当前页面` : "已重新载入当前页面"));

onMounted(() => {
  if (!isReloadNavigation()) return;

  refreshedAt.value = new Date().toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  visible.value = true;
  timer = window.setTimeout(() => {
    visible.value = false;
  }, 2600);
});

onBeforeUnmount(() => {
  if (timer) window.clearTimeout(timer);
});

function isReloadNavigation() {
  if (typeof window === "undefined") return false;

  const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigationEntry?.type) return navigationEntry.type === "reload";

  return window.performance?.navigation?.type === 1;
}
</script>

<template>
  <Transition name="page-refresh-tip">
    <div v-if="visible" class="page-refresh-tip" role="status" aria-live="polite">
      <span class="page-refresh-tip__dot" aria-hidden="true"></span>
      <div class="page-refresh-tip__content">
        <strong>页面已刷新</strong>
        <span>{{ subtitle }}</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.page-refresh-tip {
  position: fixed;
  top: calc(var(--vp-nav-height) + 14px);
  left: 50%;
  z-index: 90;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  min-width: 240px;
  max-width: min(520px, calc(100vw - 32px));
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 20%, transparent);
  border-radius: 999px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent), transparent 52%),
    color-mix(in srgb, var(--vp-c-bg-elv) 92%, white 8%);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(12px);
  transform: translateX(-50%);
}

.page-refresh-tip__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--vp-c-brand-1), #7dd3fc);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
}

.page-refresh-tip__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.page-refresh-tip__content strong {
  color: var(--vp-c-text-1);
  font-size: 13px;
  line-height: 1.2;
}

.page-refresh-tip__content span {
  color: var(--vp-c-text-2);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-refresh-tip-enter-active,
.page-refresh-tip-leave-active {
  transition: all 0.22s ease;
}

.page-refresh-tip-enter-from,
.page-refresh-tip-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

@media (max-width: 640px) {
  .page-refresh-tip {
    top: calc(var(--vp-nav-height) + 10px);
    width: calc(100vw - 24px);
    min-width: 0;
    border-radius: 18px;
  }
}
</style>

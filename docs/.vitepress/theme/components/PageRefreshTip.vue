<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const visible = ref(false);
const timeText = ref("");
const reminderText = ref("");

let timer = 0;
const displayMs = 5000;
let startAt = 0;
let remaining = displayMs;

const clearTimer = () => {
  if (timer) window.clearTimeout(timer);
  timer = 0;
};

const scheduleHide = (ms: number) => {
  clearTimer();
  startAt = Date.now();
  remaining = ms;
  timer = window.setTimeout(() => {
    visible.value = false;
    clearTimer();
  }, ms);
};

const handleMouseEnter = () => {
  if (!visible.value) return;
  const elapsed = Date.now() - startAt;
  remaining = Math.max(0, remaining - elapsed);
  clearTimer();
};

const handleMouseLeave = () => {
  if (!visible.value) return;
  if (remaining > 0) scheduleHide(remaining);
  else visible.value = false;
};

const getReminder = (date: Date) => {
  const h = date.getHours();
  if (h >= 5 && h < 9) return "先喝口水，安排下今天的计划吧";
  if (h >= 9 && h < 11) return "专注一段时间，记得起来活动下";
  if (h >= 11 && h < 14) return "忙也别忘了吃饭，休息一下再继续";
  if (h >= 14 && h < 18) return "繁忙的下午也要适当休息哦";
  if (h >= 18 && h < 22) return "可以收尾今天的任务，别太晚";
  return "早点休息，别熬夜";
};

onMounted(() => {
  if (!shouldShowTip()) return;

  const now = new Date();
  timeText.value = now.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  reminderText.value = getReminder(now);

  visible.value = true;
  scheduleHide(displayMs);
});

onBeforeUnmount(() => {
  clearTimer();
});

function shouldShowTip() {
  if (typeof window === "undefined") return false;

  const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigationEntry?.type) return navigationEntry.type === "reload";

  return window.performance?.navigation?.type === 1;
}
</script>

<template>
  <Transition name="page-refresh-tip">
    <div
      v-if="visible"
      class="page-refresh-tip"
      role="status"
      aria-live="polite"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="page-refresh-tip__content">
        <span class="page-refresh-tip__text">
          <span class="page-refresh-tip__prefix">现在是</span>
          <span class="page-refresh-tip__time">{{ timeText }}</span>
          <span class="page-refresh-tip__suffix">，{{ reminderText }}</span>
          <span class="page-refresh-tip__tail" aria-hidden="true">
            <span class="page-refresh-tip__emoji">🍎</span>
            <span class="page-refresh-tip__waves">~~</span>
            <span class="page-refresh-tip__commit">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  d="M4 12h6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  opacity="0.9"
                />
                <path
                  d="M14 12h6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  opacity="0.9"
                />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8" opacity="0.95" />
              </svg>
            </span>
          </span>
        </span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.page-refresh-tip {
  position: fixed;
  top: calc(var(--vp-nav-height) + 14px);
  left: 50%;
  z-index: 110;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 8px 14px;
  min-width: 0;
  max-width: min(720px, calc(100vw - 32px));
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.76));
  box-shadow:
    0 14px 34px rgba(15, 23, 42, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.55) inset;
  backdrop-filter: blur(12px);
  transform: translateX(-50%);
}

.page-refresh-tip:hover {
  box-shadow:
    0 18px 44px rgba(15, 23, 42, 0.14),
    0 1px 0 rgba(255, 255, 255, 0.65) inset;
}

.dark .page-refresh-tip,
:global(.dark) .page-refresh-tip {
  background: linear-gradient(90deg, rgba(17, 24, 39, 0.72), rgba(17, 24, 39, 0.58));
  box-shadow:
    0 18px 46px rgba(0, 0, 0, 0.35),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
}

.page-refresh-tip__content {
  display: flex;
  align-items: center;
  min-width: 0;
}

.page-refresh-tip__text {
  color: var(--vp-c-text-1);
  font-size: 13px;
  line-height: 1.35;
  letter-spacing: 0.15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-refresh-tip__prefix,
.page-refresh-tip__suffix {
  color: var(--vp-c-text-2);
}

.page-refresh-tip__time {
  margin: 0 6px 0 6px;
  color: color-mix(in srgb, #fbbf24 72%, var(--vp-c-text-1) 28%);
  font-variant-numeric: tabular-nums;
}

.page-refresh-tip__tail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  color: color-mix(in srgb, #fbbf24 62%, var(--vp-c-text-2) 38%);
}

.page-refresh-tip__emoji {
  font-size: 13px;
  line-height: 1;
}

.page-refresh-tip__waves {
  font-size: 13px;
  opacity: 0.75;
}

.page-refresh-tip__commit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: color-mix(in srgb, #fbbf24 72%, var(--vp-c-text-2) 28%);
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
    border-radius: 16px;
  }

  .page-refresh-tip__text {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { TkMessage } from "@teek/components/common/Message";
import { createImageViewer } from "@teek/components/common/ImageViewer";
import { loadGalleryAssets, type GalleryAssetCategory, type GalleryAssetItem } from "../composables/useGalleryAssets";

type PositionedAsset = GalleryAssetItem & {
  index: number;
  top: number;
  left: number;
  width: number;
  height: number;
  mediaHeight: number;
};

const loading = ref(true);
const errorMessage = ref("");
const categories = ref<GalleryAssetCategory[]>([]);
const allItems = ref<GalleryAssetItem[]>([]);
const activeCategory = ref("all");
const imageAspectRatioMap = ref<Record<string, number>>({});
const gridRef = ref<HTMLElement | null>(null);
const gridWidth = ref(0);
const containerTop = ref(0);
const scrollTop = ref(0);
const viewportHeight = ref(0);
const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  item: GalleryAssetItem | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  item: null,
});

let resizeObserver: ResizeObserver | null = null;
let rafId = 0;

const tabs = computed(() => [
  {
    key: "all",
    label: "全部",
    count: allItems.value.length,
    description: "按全部分类混排展示",
  },
  ...categories.value.map(category => ({
    key: category.key,
    label: category.label,
    count: category.count,
    description: category.description || "",
  })),
]);

const filteredItems = computed(() => {
  if (activeCategory.value === "all") return allItems.value;
  return allItems.value.filter(item => item.categoryKey === activeCategory.value);
});

const currentTab = computed(() => tabs.value.find(tab => tab.key === activeCategory.value) || tabs.value[0]);
const activeTabIndex = computed(() => tabs.value.findIndex(tab => tab.key === activeCategory.value));
const heroImage = computed(() => {
  const coverItems = allItems.value.filter(item => item.categoryKey === "cover");
  if (!coverItems.length) return "";
  const index = Math.floor(Math.random() * coverItems.length);
  return coverItems[index]?.url || "";
});

const columnGap = 28;
const cardExtraHeight = 0;
const minCardWidth = 420;

const columnCount = computed(() => {
  if (!gridWidth.value) return 1;

  const prefersLargeCards = ["all", "banner", "cover"].includes(activeCategory.value);

  if (prefersLargeCards) {
    if (gridWidth.value >= 980) return 2;
    return 1;
  }

  if (gridWidth.value >= 1480) return 3;
  if (gridWidth.value >= 860) return 2;
  return 1;
});

const cardWidth = computed(() => {
  const columns = columnCount.value;
  return columns === 1 ? gridWidth.value : (gridWidth.value - columnGap * (columns - 1)) / columns;
});

const positionedItems = computed<PositionedAsset[]>(() => {
  const columns = columnCount.value;
  const width = Math.max(cardWidth.value, 0);
  const columnHeights = Array.from({ length: columns }, () => 0);

  return filteredItems.value.map((item, index) => {
    const aspectRatio = imageAspectRatioMap.value[item.id] || item.aspectRatio || 1;
    const displayAspectRatio = getDisplayAspectRatio(item, index, aspectRatio);
    const mediaHeight = width > 0 ? width / displayAspectRatio : 320;
    const height = mediaHeight + cardExtraHeight;
    const targetColumn = columnHeights.indexOf(Math.min(...columnHeights));
    const top = columnHeights[targetColumn];
    const left = targetColumn * (width + columnGap);

    columnHeights[targetColumn] += height + columnGap;

    return {
      ...item,
      index,
      top,
      left,
      width,
      height,
      mediaHeight,
    };
  });
});

const contentHeight = computed(() => {
  if (!positionedItems.value.length) return 0;
  return Math.max(...positionedItems.value.map(item => item.top + item.height));
});

const overscan = computed(() => Math.max(viewportHeight.value * 0.45, 360));

const visibleItems = computed(() => {
  const start = scrollTop.value - overscan.value;
  const end = scrollTop.value + viewportHeight.value + overscan.value;

  return positionedItems.value.filter(item => {
    const absoluteTop = containerTop.value + item.top;
    const absoluteBottom = absoluteTop + item.height;
    return absoluteBottom >= start && absoluteTop <= end;
  });
});

onMounted(async () => {
  await loadAssets();
  syncMetrics();

  window.addEventListener("scroll", requestSyncMetrics, { passive: true });
  window.addEventListener("resize", requestSyncMetrics, { passive: true });
  window.addEventListener("pointerdown", handleGlobalPointerDown, { passive: true });
  window.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("scroll", closeContextMenu, { passive: true });

  resizeObserver = new ResizeObserver(() => requestSyncMetrics());
  if (gridRef.value) resizeObserver.observe(gridRef.value);
});

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
  window.removeEventListener("scroll", requestSyncMetrics);
  window.removeEventListener("resize", requestSyncMetrics);
  window.removeEventListener("pointerdown", handleGlobalPointerDown);
  window.removeEventListener("keydown", handleGlobalKeydown);
  window.removeEventListener("scroll", closeContextMenu);
  resizeObserver?.disconnect();
});

watch(filteredItems, async () => {
  await nextTick();
  requestSyncMetrics();
});

async function loadAssets() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const dataset = await loadGalleryAssets();
    allItems.value = dataset.items;
    categories.value = dataset.categories.filter(category => category.count > 0);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "相册数据加载失败";
  } finally {
    loading.value = false;
    await nextTick();
  }
}

function requestSyncMetrics() {
  if (rafId) return;

  rafId = window.requestAnimationFrame(() => {
    rafId = 0;
    syncMetrics();
  });
}

function syncMetrics() {
  if (typeof window === "undefined") return;

  scrollTop.value = window.scrollY;
  viewportHeight.value = window.innerHeight;

  if (!gridRef.value) return;

  gridWidth.value = gridRef.value.clientWidth;
  const rect = gridRef.value.getBoundingClientRect();
  containerTop.value = rect.top + window.scrollY;
}

function handleTabChange(key: string) {
  activeCategory.value = key;
  closeContextMenu();
  requestSyncMetrics();
}

function getDisplayAspectRatio(item: GalleryAssetItem, index: number, naturalAspectRatio: number) {
  const categoryPresets: Record<string, number[]> = {
    banner: [1.14, 0.84, 1.32, 0.92, 1.06],
    cover: [0.82, 1.18, 0.92, 1.28, 0.76],
    gallery: [0.88, 1.22, 0.74, 1.08, 0.96],
    post: [1.08, 0.86, 1.24, 0.78, 0.98],
  };

  const presets = categoryPresets[item.categoryKey] || [0.9, 1.1, 0.8, 1.2];
  const targetRatio = presets[index % presets.length];

  // 用稳定的预设比例主导布局，避免同类图片因为原始比例接近而显得过于整齐
  const blendedRatio = naturalAspectRatio * 0.25 + targetRatio * 0.75;
  return Math.max(0.62, Math.min(1.42, blendedRatio));
}

function handleImageLoad(item: GalleryAssetItem, event: Event) {
  const target = event.target as HTMLImageElement | null;
  if (!target?.naturalWidth || !target.naturalHeight) return;

  const nextAspectRatio = target.naturalWidth / target.naturalHeight;
  if (Math.abs((imageAspectRatioMap.value[item.id] || item.aspectRatio) - nextAspectRatio) < 0.01) return;

  imageAspectRatioMap.value = {
    ...imageAspectRatioMap.value,
    [item.id]: nextAspectRatio,
  };
}

function openViewer(target: GalleryAssetItem) {
  const urlList = filteredItems.value.map(item => item.url);
  const initialIndex = filteredItems.value.findIndex(item => item.id === target.id);

  createImageViewer({
    urlList,
    initialIndex,
    infinite: false,
  });
}

async function copyImageUrl(item: GalleryAssetItem) {
  try {
    await navigator.clipboard.writeText(item.url);
    TkMessage.success({
      message: "图片地址已复制",
      plain: true,
    });
  } catch {
    TkMessage.error({
      message: "复制失败，请检查浏览器权限",
      plain: true,
    });
  } finally {
    closeContextMenu();
  }
}

function openContextMenu(item: GalleryAssetItem, event: MouseEvent) {
  event.preventDefault();

  const menuWidth = 148;
  const menuHeight = 52;
  const padding = 12;
  const maxX = window.innerWidth - menuWidth - padding;
  const maxY = window.innerHeight - menuHeight - padding;

  contextMenu.value = {
    visible: true,
    x: Math.min(event.clientX, maxX),
    y: Math.min(event.clientY, maxY),
    item,
  };
}

function closeContextMenu() {
  if (!contextMenu.value.visible) return;
  contextMenu.value.visible = false;
}

function handleGlobalPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest(".gallery-context-menu")) return;
  closeContextMenu();
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") closeContextMenu();
}
</script>

<template>
  <section class="gallery-page">
    <header class="gallery-page__hero" :style="heroImage ? { backgroundImage: `url(${heroImage})` } : undefined">
      <div class="gallery-page__hero-mask"></div>
      <div class="gallery-page__hero-content">
        <p class="gallery-page__eyebrow">Gallery</p>
        <h1>图库</h1>
        <!-- <p class="gallery-page__desc">按分类浏览当前项目的封面、插图、Banner 与个人收藏图片资源。</p> -->
      </div>
    </header>

    <div class="gallery-page__toolbar">
      <div class="gallery-page__tabs" role="tablist" aria-label="相册分类">
        <span
          class="gallery-page__tab-indicator"
          :style="{
            width: `calc((100% - 20px - ${(tabs.length - 1) * 10}px) / ${tabs.length})`,
            transform: `translateX(calc(${activeTabIndex} * (100% + 10px)))`,
          }"
        ></span>
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="gallery-page__tab"
          :class="{ 'is-active': activeCategory === tab.key }"
          type="button"
          role="tab"
          :aria-selected="activeCategory === tab.key"
          @click="handleTabChange(tab.key)"
        >
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="gallery-page__loading" aria-live="polite">
      <div v-for="index in 10" :key="index" class="gallery-page__skeleton"></div>
    </div>

    <div v-else-if="errorMessage" class="gallery-page__empty gallery-page__empty--error">
      <strong>相册数据加载失败</strong>
      <span>{{ errorMessage }}</span>
    </div>

    <div v-else-if="!filteredItems.length" class="gallery-page__empty">
      <strong>当前分类还没有图片</strong>
      <span>后续往图床目录补图后，这里会自动展示。</span>
    </div>

    <div v-else ref="gridRef" class="gallery-page__grid">
      <div class="gallery-page__canvas" :style="{ height: `${contentHeight}px` }">
        <article
          v-for="item in visibleItems"
          :key="item.id"
          class="gallery-card"
          :style="{
            width: `${item.width}px`,
            height: `${item.height}px`,
            transform: `translate3d(${item.left}px, ${item.top}px, 0)`,
          }"
        >
          <button
            class="gallery-card__media"
            type="button"
            @click="openViewer(item)"
            @contextmenu="openContextMenu(item, $event)"
          >
            <img
              :src="item.url"
              :alt="item.title"
              loading="lazy"
              decoding="async"
              :style="{ height: `${item.mediaHeight}px` }"
              @load="handleImageLoad(item, $event)"
            />
          </button>
        </article>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="gallery-context-menu">
        <div
          v-if="contextMenu.visible && contextMenu.item"
          class="gallery-context-menu"
          :style="{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }"
        >
          <button type="button" @click="copyImageUrl(contextMenu.item)">复制图片地址</button>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.gallery-page {
  width: min(1480px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 0 0 72px;
}

.gallery-page__hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  margin-bottom: 28px;
  overflow: hidden;
  border-radius: 0 0 28px 28px;
  background:
    linear-gradient(180deg, rgba(10, 15, 26, 0.24), rgba(10, 15, 26, 0.46)),
    linear-gradient(120deg, color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent), transparent 60%),
    var(--vp-c-bg-soft);
  background-position: center;
  background-size: cover;
}

.gallery-page__hero-mask {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.16), rgba(15, 23, 42, 0.5)),
    radial-gradient(circle at center, rgba(255, 255, 255, 0.06), transparent 55%);
}

.gallery-page__hero-content {
  position: relative;
  z-index: 1;
  padding: 36px 20px;
  text-align: center;
}

.gallery-page__eyebrow {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.gallery-page__hero h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(34px, 4vw, 48px);
  line-height: 1.1;
  text-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
}

.gallery-page__desc {
  margin: 16px auto 0;
  max-width: 760px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.75;
  text-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
}

.gallery-page__toolbar {
  display: flex;
  justify-content: center;
  margin: 0 0 28px;
  padding: 0 16px;
}

.gallery-page__tabs {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 10px;
  min-width: min(640px, 100%);
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 80%, transparent);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--vp-c-bg-soft) 92%, white 8%), var(--vp-c-bg));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 12px 28px rgba(15, 23, 42, 0.06);
}

.gallery-page__tab-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  bottom: 10px;
  border-radius: 999px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--vp-c-brand-1) 16%, white 84%), color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent));
  box-shadow:
    0 10px 18px rgba(59, 130, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  transition: transform 0.26s ease, width 0.26s ease;
}

.gallery-page__tab {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 10px 18px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.22s ease, transform 0.22s ease, background-color 0.22s ease;
}

.gallery-page__tab:hover {
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
  color: var(--vp-c-text-1);
  transform: translateY(-1px);
}

.gallery-page__tab.is-active {
  color: var(--vp-c-brand-1);
}

.gallery-page__loading {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.gallery-page__skeleton {
  height: 280px;
  border-radius: 20px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--vp-c-bg-soft) 92%, white 8%) 25%, var(--vp-c-bg-elv) 37%, color-mix(in srgb, var(--vp-c-bg-soft) 92%, white 8%) 63%);
  background-size: 400% 100%;
  animation: gallery-skeleton 1.4s ease infinite;
}

.gallery-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 280px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 24px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.gallery-page__empty--error {
  border-style: solid;
  border-color: color-mix(in srgb, var(--vp-c-danger-1) 30%, transparent);
}

.gallery-page__grid {
  position: relative;
}

.gallery-page__canvas {
  position: relative;
  width: 100%;
}

.gallery-card {
  position: absolute;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 92%, transparent);
  border-radius: 22px;
  background: var(--vp-c-bg-elv);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
  contain: layout paint;
  will-change: transform;
}

.gallery-card__media {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: linear-gradient(180deg, color-mix(in srgb, var(--vp-c-bg-soft) 80%, white 20%), var(--vp-c-bg-soft));
  cursor: zoom-in;
}

.gallery-card__media img {
  display: block;
  width: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.gallery-card:hover .gallery-card__media img {
  transform: scale(1.02);
}

.gallery-context-menu {
  position: fixed;
  z-index: 120;
  min-width: 148px;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 82%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--vp-c-bg) 86%, white 14%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(14px);
}

.gallery-context-menu button {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--vp-c-text-1);
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.gallery-context-menu button:hover {
  background: color-mix(in srgb, var(--vp-c-brand-soft) 72%, white 28%);
  color: var(--vp-c-brand-1);
}

.gallery-context-menu-enter-active,
.gallery-context-menu-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.gallery-context-menu-enter-from,
.gallery-context-menu-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@keyframes gallery-skeleton {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: 0 0;
  }
}

@media (max-width: 960px) {
  .gallery-page {
    width: 100%;
  }

  .gallery-page__hero {
    min-height: 280px;
    margin-bottom: 22px;
    border-radius: 0 0 22px 22px;
  }

  .gallery-page__tabs {
    gap: 8px;
    width: 100%;
    min-width: 0;
    border-radius: 22px;
  }

  .gallery-page__toolbar {
    padding: 0 12px;
  }

  .gallery-page__tab {
    min-width: 0;
    padding: 10px 12px;
    font-size: 13px;
  }
}
</style>

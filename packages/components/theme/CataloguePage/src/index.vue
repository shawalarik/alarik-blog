<script setup lang="ts" name="CataloguePage">
import { computed, ref, provide, watch } from "vue";
import { useData } from "vitepress";
import { useNamespace, useLocale } from "@teek/composables";
import { TkArticlePage } from "@teek/components/common/ArticlePage";
import CatalogueItem from "./CatalogueItem.vue";

defineOptions({ name: "CataloguePage" });

const ns = useNamespace("catalogue");
const { t } = useLocale();
const { site, theme, frontmatter } = useData();
const assetMeta = computed(() => theme.value.assetMeta || {});
const isGridStyle = computed(() => frontmatter.value.catalogueStyle === "grid");
const isAutoOnly = computed(() => frontmatter.value.catalogueAutoOnly === true);
const headerDescription = computed(
  () => frontmatter.value.catalogueDesc || frontmatter.value.desc || frontmatter.value.description || ""
);
const heroBackground = computed(() => {
  const cdnBase = assetMeta.value.cdnBase || "";
  const total = Math.max(Number(assetMeta.value.coverCount) || 0, 1);
  const seedSource = frontmatter.value.permalink || frontmatter.value.path || frontmatter.value.title || "catalogue";
  const hash = Array.from(seedSource).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = (hash % total) + 1;
  return cdnBase ? `${cdnBase}/cover/cover${index}.jpg` : "";
});

// 目录列表
const catalogues = computed(() => theme.value.catalogues?.inv[frontmatter.value.path]?.catalogues);

// 是否有目录数据
const hasCatalogues = computed(() => catalogues.value && catalogues.value.length > 0);

// 全局展开/折叠控制
const collapseKey = ref(0);
const hasCollapsibleGroups = computed(() => catalogues.value?.some(item => item.children && item.children.length > 0));

function expandAll() {
  collapseKey.value++;
  (window as any).__catalogue_force_expand__ = true;
}

function collapseAll() {
  collapseKey.value++;
  (window as any).__catalogue_force_expand__ = false;
}

provide("collapseKey", collapseKey);
provide("forceExpand", () => (window as any).__catalogue_force_expand__);

const syncPermalinkUrl = () => {
  const { base } = site.value;
  const { permalinks = {} } = theme.value;
  const fakeHost = "http://a.com";
  const href = window.location.href;

  // 策略1：优先从当前页面 frontmatter.permalink 直接获取（最可靠）
  const fmPermalink = frontmatter.value.permalink;

  if (fmPermalink) {
    const { search, hash } = new URL(href, fakeHost);
    const to = base.replace(/\/$/, "") + standardLink(fmPermalink) + search + hash;
    history.replaceState(history.state || null, "", to);
    return;
  }

  // 策略2：fallback 到 permalinks.map 查找（兼容无 frontmatter.permalink 的情况）
  if (!Object.keys(permalinks).length) return;

  const { pathname, search, hash } = new URL(href, fakeHost);
  const decodePath = decodeURIComponent(pathname.slice(base.length).replace(/\/$/, ""));
  const lookupKey = decodePath.replace(/\.html/, "");

  const permalink =
    permalinks.map[lookupKey] || permalinks.map[lookupKey + "/"] || permalinks.map[lookupKey.replace(/\/$/, "")];

  if (permalink && permalink !== "/" + decodePath) {
    const to = base.replace(/\/$/, "") + permalink + search + hash;
    history.replaceState(history.state || null, "", to);
  }
};

watch(
  () => [frontmatter.value.path, frontmatter.value.permalink, pageUrlKey()],
  () => syncPermalinkUrl(),
  { immediate: true }
);

function pageUrlKey() {
  return typeof window === "undefined" ? "" : window.location.pathname;
}

/**
 * 处理 permalink 格式：确保以 / 开头，不以 / 结尾
 */
function standardLink(link: string): string {
  let result = link;
  if (!result.startsWith("/")) result = "/" + result;
  if (result.endsWith("/")) result = result.replace(/\/$/, "");
  return result;
}
</script>

<template>
  <TkArticlePage :class="[ns.b(), { 'catalogue-page--grid': isGridStyle }]" :aria-label="t('tk.catalogue.label')">
    <section class="catalogue-hero" :style="{ backgroundImage: `url(${heroBackground})` }">
      <div class="catalogue-hero__mask"></div>
      <div class="catalogue-hero__content">
        <p class="catalogue-hero__eyebrow">Catalogue</p>
        <h2 id="catalogue-header-title">{{ frontmatter.title }}</h2>
        <div class="description">{{ headerDescription }}</div>
      </div>
    </section>

    <div class="catalogue-shell">
      <slot name="teek-catalogue-top-before" />

      <div :class="ns.e('header')" role="group" aria-labelledby="catalogue-header-title">
        <!-- 目录统计 -->
        <div v-if="hasCatalogues && !isGridStyle" class="stats-bar">
          <span class="stat-item">
            <span class="stat-icon">📚</span>
            <span class="stat-label">{{ catalogues.length }} 个专题</span>
          </span>
          <span class="stat-item">
            <span class="stat-icon">📄</span>
            <span class="stat-label">{{ catalogues.reduce((sum, c) => sum + (c.children?.length || 1), 0) }} 篇文章</span>
          </span>
        </div>
      </div>

      <slot name="teek-catalogue-top-after" />

      <div :class="ns.e('wrapper')" aria-labelledby="catalogue-list-title">
        <div v-if="hasCatalogues && !isGridStyle" id="catalogue-list-title" class="title">
          {{ frontmatter.pageTitle || t("tk.catalogue.title") }}
        </div>

        <!-- 展开全部 / 折叠全部按钮 -->
        <div v-if="hasCollapsibleGroups && !isGridStyle" class="toolbar">
          <button class="toolbar-btn" type="button" @click="expandAll">展开全部</button>
          <button class="toolbar-btn" type="button" @click="collapseAll">折叠全部</button>
        </div>

        <ul :class="['catalogue-list', { 'catalogue-list--grid': isGridStyle }]" role="list">
          <template v-for="(item, index) in catalogues" :key="index">
            <CatalogueItem :item :index="index + 1" />
          </template>
        </ul>
      </div>
    </div>

    <div v-if="!isAutoOnly" class="vp-doc">
      <Content />
    </div>
  </TkArticlePage>
</template>

<style scoped>
.catalogue-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  margin: -24px calc(50% - 50vw) 0;
  overflow: hidden;
  background-position: center;
  background-size: cover;
}

.catalogue-hero__mask {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.45)),
    linear-gradient(120deg, rgba(255, 255, 255, 0.08), transparent 55%);
}

.catalogue-hero__content {
  position: relative;
  z-index: 1;
  width: min(1200px, calc(100vw - 48px));
  padding: 40px 24px 86px;
  text-align: center;
  color: #fff;
}

.catalogue-hero__eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  opacity: 0.9;
}

.catalogue-shell {
  width: min(1080px, calc(100vw - 48px));
  margin: -52px auto 0;
  padding: 28px 30px 24px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 84%, transparent);
  border-radius: 26px;
  background: color-mix(in srgb, var(--vp-c-bg) 92%, white 8%);
  box-shadow: 0 20px 46px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);
}

.catalogue-shell :deep(.tk-catalogue__header) {
  margin-bottom: 12px;
}

.catalogue-hero h2 {
  margin: 0;
  color: inherit;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.1;
  text-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
}

.stats-bar {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 2px;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 85%, white 15%);
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.stat-icon {
  font-size: 15px;
}

.toolbar {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.toolbar-btn {
  font-size: 12px;
  padding: 7px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 88%, white 12%);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.18s ease;
}

.toolbar-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.catalogue-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.catalogue-page--grid {
  width: min(1200px, calc(100vw - 72px)) !important;
}

.catalogue-list--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px 40px;
  margin-top: 20px;
  margin-left: 1px;
}

.catalogue-list--grid :deep(.catalogue-item) {
  list-style: none;
  width: 100%;
  min-width: 0;
}

.catalogue-list--grid :deep(.catalogue-item a) {
  display: inline-flex;
  align-items: baseline;
  width: 100%;
  min-width: 0;
  padding: 0;
  border-radius: 0;
  white-space: nowrap;
  color: var(--vp-c-brand-1);
}

.catalogue-list--grid :deep(.catalogue-item__index),
.catalogue-list--grid :deep(.catalogue-item__title) {
  color: var(--vp-c-brand-1);
  white-space: nowrap;
}

.catalogue-list--grid :deep(.catalogue-item__title) {
  overflow: visible;
  text-overflow: clip;
}

.catalogue-list--grid :deep(.catalogue-item a:hover) {
  background: transparent;
  transform: none;
  text-decoration: underline;
}

@media (max-width: 900px) {
  .catalogue-page--grid {
    width: calc(100vw - 24px) !important;
  }

  .catalogue-list--grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
.description {
  margin: 14px auto 0;
  max-width: 820px;
  letter-spacing: 0.5px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
}

:deep(.catalogue-item) {
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 80%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 86%, white 14%);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

:deep(.catalogue-item:hover) {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 24%, transparent);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

:deep(.catalogue-item a) {
  padding: 10px 14px;
  border-radius: inherit;
}

@media (max-width: 900px) {
  .catalogue-hero {
    min-height: 220px;
  }

  .catalogue-hero__content {
    width: calc(100vw - 24px);
    padding: 32px 16px 72px;
  }

  .catalogue-shell {
    width: calc(100vw - 24px);
    margin-top: -40px;
    padding: 20px 16px;
    border-radius: 22px;
  }

  .stats-bar {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .toolbar {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>

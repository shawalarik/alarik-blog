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
const isGridStyle = computed(() => frontmatter.value.catalogueStyle === "grid");
const isAutoOnly = computed(() => frontmatter.value.catalogueAutoOnly === true);
const headerDescription = computed(
  () => frontmatter.value.catalogueDesc || frontmatter.value.desc || frontmatter.value.description || ""
);

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
    <slot name="teek-catalogue-top-before" />

    <div :class="ns.e('header')" role="group" aria-labelledby="catalogue-header-title">
      <h2 id="catalogue-header-title">{{ frontmatter.title }}</h2>
      <div class="description">{{ headerDescription }}</div>
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

    <div v-if="!isAutoOnly" class="vp-doc">
      <Content />
    </div>
  </TkArticlePage>
</template>

<style scoped>
.stats-bar {
  display: flex;
  gap: 20px;
  margin-top: 14px;
  padding: 10px 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
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
  margin-bottom: 12px;
}

.toolbar-btn {
  font-size: 12px;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s ease;
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
  gap: 4px;
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
  letter-spacing: 1px
}
</style>

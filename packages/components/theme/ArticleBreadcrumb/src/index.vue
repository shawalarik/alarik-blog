<script setup lang="ts" name="ArticleBreadcrumb">
import type { Breadcrumb as BreadcrumbType } from "@teek/config";
import { computed } from "vue";
import { useData, useRoute, withBase } from "vitepress";
import { useNamespace, useLocale } from "@teek/composables";
import { houseIcon } from "@teek/static";
import { useTeekConfig } from "@teek/components/theme/ConfigProvider";
import { TkBreadcrumb, TkBreadcrumbItem } from "@teek/components/common/Breadcrumb";
import { TkIcon } from "@teek/components/common/Icon";

defineOptions({ name: "ArticleBreadcrumb" });

const ns = useNamespace("article-breadcrumb");
const { t } = useLocale();

const { getTeekConfigRef } = useTeekConfig();
const { localeIndex, theme, page } = useData();
const route = useRoute();

// 面包屑配置项
const breadcrumb = getTeekConfigRef<BreadcrumbType>("breadcrumb", {
  enabled: true,
  showCurrentName: false,
  separator: "/",
  homeLabel: t("tk.articleBreadcrumb.home"),
});
const relativePathArr = computed(() => page.value.filePath.split("/") || []);

const resolveBreadcrumbUrl = (path: string) => {
  const permalinkMap = theme.value.permalinks?.map || {};
  const catalogueUrl = theme.value.catalogues?.inv[path]?.url || "";
  const permalink =
    permalinkMap[path] ||
    permalinkMap[path + "/"] ||
    permalinkMap[path.replace(/\/$/, "")] ||
    permalinkMap[path.replace(/^\//, "")] ||
    permalinkMap[path.replace(/^\//, "") + "/"] ||
    permalinkMap[path.replace(/^\//, "").replace(/\/$/, "")];

  return permalink || catalogueUrl;
};
const normalizeUrl = (url = "") => {
  if (!url) return "";
  return `/${url.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\.html$/, "")}`;
};

const resolvePhysicalPathByPermalink = (path: string) => {
  const permalinkInv = theme.value.permalinks?.inv || {};
  const normalized = path.replace(/^\/+/, "").replace(/\/+$/, "");
  const candidates = [
    `/${normalized}`,
    `/${normalized}.html`,
    `/${normalized}/`,
    normalized,
    `${normalized}.html`,
    `${normalized}/`,
  ];

  for (const candidate of candidates) {
    const physical = permalinkInv[candidate];
    if (physical) return physical;
  }
  return "";
};

const resolveModuleTitle = (path: string, fallback: string) => {
  const sidebar = theme.value.sidebar as Record<string, any>;
  if (!sidebar || Array.isArray(sidebar)) return fallback;

  const physicalFilePath = resolvePhysicalPathByPermalink(path);
  let modulePath = "";
  if (physicalFilePath) {
    const parts = physicalFilePath.replace(/^\/+/, "").replace(/\.html$/, "").split("/").filter(Boolean);
    if (parts.length) {
      modulePath = parts.at(-1)?.toLowerCase() === "index" ? parts.slice(0, -1).join("/") : parts.slice(0, -1).join("/");
    }
  }

  if (!modulePath) {
    const currentUrl = normalizeUrl(resolveBreadcrumbUrl(path));
    const catalogueMap = theme.value.catalogues?.map || {};
    const match = Object.values(catalogueMap).find((item: any) => normalizeUrl(item?.url) === currentUrl) as
      | { path?: string }
      | undefined;
    modulePath = match?.path || "";
  }

  const keyCandidates = [
    modulePath ? `/${modulePath.replace(/^\/+|\/+$/g, "")}/` : "",
    `/${path.replace(/^\/+|\/+$/g, "")}/`,
  ].filter(Boolean);

  for (const key of keyCandidates) {
    const groups = sidebar[key];
    const title = Array.isArray(groups) ? groups[0]?.text : "";
    if (title) return title;
  }
  return fallback;
};

const isPathPrefix = (fullPath: string, candidate: string) =>
  fullPath === candidate || fullPath.startsWith(`${candidate}/`);

const hasChildLinkPrefix = (items: any[], currentUrl: string): boolean => {
  for (const item of items || []) {
    if (!item) continue;
    const itemLink = normalizeUrl(item.link || "");
    if (itemLink && isPathPrefix(currentUrl, itemLink)) return true;
    if (Array.isArray(item.items) && item.items.length && hasChildLinkPrefix(item.items, currentUrl)) return true;
  }
  return false;
};

const getFirstPathSegment = (url = "") => {
  const normalized = normalizeUrl(url).replace(/^\/+|\/+$/g, "");
  return normalized.split("/").filter(Boolean)[0] || "";
};

const collectNavLinks = (items: any[]): string[] => {
  const links: string[] = [];
  for (const item of items || []) {
    if (!item) continue;
    if (item.link) links.push(item.link);
    if (Array.isArray(item.items) && item.items.length) {
      links.push(...collectNavLinks(item.items));
    }
  }
  return links;
};

const findNavTitleByUrl = (items: any[], currentUrl: string): string => {
  for (const item of items || []) {
    if (!item) continue;
    const text = item.text || "";
    const itemLink = normalizeUrl(item.link || "");
    if (text && itemLink && itemLink === currentUrl) return text;
    if (Array.isArray(item.items) && item.items.length) {
      const child = findNavTitleByUrl(item.items, currentUrl);
      if (child) return child;
    }
  }
  return "";
};

const resolveFirstSegmentTitle = (currentUrl: string, firstSegment: string, fallback: string) => {
  if (!currentUrl) return fallback;
  const navSource = theme.value.nav;
  const navItems = Array.isArray(navSource)
    ? navSource
    : Object.values(navSource || {}).flatMap((item: any) => item?.nav || item || []);
  const normalizedSegment = firstSegment.replace(/^\/+|\/+$/g, "").toLowerCase();

  for (const item of navItems as any[]) {
    if (!item?.text || !normalizedSegment) continue;
    const links = collectNavLinks([item]);
    if (links.some((link) => getFirstPathSegment(link).toLowerCase() === normalizedSegment)) return item.text;
  }

  for (const item of navItems as any[]) {
    if (!item) continue;
    const text = item.text || "";
    const itemLink = normalizeUrl(item.link || "");
    if (itemLink && isPathPrefix(currentUrl, itemLink) && text) return text;
    if (Array.isArray(item.items) && item.items.length && hasChildLinkPrefix(item.items, currentUrl) && text) return text;
  }

  return fallback;
};

const resolveNavTitleByCurrentUrl = (currentUrl: string, fallback: string) => {
  if (!currentUrl) return fallback;
  const navSource = theme.value.nav;
  const navItems = Array.isArray(navSource)
    ? navSource
    : Object.values(navSource || {}).flatMap((item: any) => item?.nav || item || []);
  return findNavTitleByUrl(navItems as any[], currentUrl) || fallback;
};

const normalizeSegment = (segment = "") => segment.toLowerCase().replace(/[\s_-]/g, "");
const getPathSegments = (url = "") =>
  normalizeUrl(url)
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

const collectNavEntries = (items: any[]): Array<{ text: string; segments: string[] }> => {
  const entries: Array<{ text: string; segments: string[] }> = [];
  for (const item of items || []) {
    if (!item) continue;
    const text = item.text || "";
    const link = item.link || "";
    if (text && link) entries.push({ text, segments: getPathSegments(link) });
    if (Array.isArray(item.items) && item.items.length) entries.push(...collectNavEntries(item.items));
  }
  return entries;
};

const resolveNavTitleBySegment = (segment: string, parentSegment: string, fallback: string) => {
  if (!segment) return fallback;
  const navSource = theme.value.nav;
  const navItems = Array.isArray(navSource)
    ? navSource
    : Object.values(navSource || {}).flatMap((item: any) => item?.nav || item || []);
  const navEntries = collectNavEntries(navItems as any[]);
  const segmentNorm = normalizeSegment(segment);
  const parentNorm = normalizeSegment(parentSegment);

  const exactEntry = navEntries.find(({ segments }) => {
    const last = normalizeSegment(segments[segments.length - 1] || "");
    if (last !== segmentNorm) return false;
    if (!parentNorm) return true;
    return segments.some(part => normalizeSegment(part) === parentNorm);
  });

  return exactEntry?.text || fallback;
};

const breadcrumbList = computed(() => {
  const classifyList: { fileName: string; url: string; path: string; segmentIndex: number }[] = [];
  const relativePathArrConst: string[] = relativePathArr.value;
  relativePathArrConst.forEach((item, index) => {
    // 去除「序号.」的前缀，并获取文件名
    const fileName = item.replace(/^\d+\./, "").split(".")?.[0] || "";

    // 兼容国际化功能，如果配置多语言，在面包屑去掉多语言根目录名
    if (
      (index !== relativePathArrConst.length - 1 || breadcrumb.value.showCurrentName) &&
      fileName !== localeIndex.value
    ) {
      // 处理多级面包屑 跳转到目录页, 加上前面的所有元素(以`/`分割)补全路径
      const path = relativePathArrConst.slice(0, index + 1).join("/");
      classifyList.push({
        fileName,
        url: resolveBreadcrumbUrl(path),
        path,
        segmentIndex: index,
      });
    }
  });
  const last = classifyList[classifyList.length - 1];
  if (last && last.segmentIndex < relativePathArrConst.length - 1) {
    last.fileName = resolveModuleTitle(last.path, last.fileName);
  }

  // 仅在存在子目录层级时，才对中间层级做中文标题替换，避免普通三段面包屑被误处理
  const hasSubDirectoryLevel = classifyList.length > 3;
  if (hasSubDirectoryLevel) {
    classifyList.forEach((item, index) => {
      if (index === 0) return;
      const moduleTitle = resolveModuleTitle(item.path, item.fileName);
      const normalizedItemUrl = normalizeUrl(item.url);
      const currentSegment = item.path.split("/").pop()?.replace(/^\d+\./, "").split(".")?.[0] || "";
      const parentSegment = classifyList[index - 1]?.path.split("/").pop()?.replace(/^\d+\./, "").split(".")?.[0] || "";
      const byNavUrl = resolveNavTitleByCurrentUrl(normalizedItemUrl, moduleTitle);
      item.fileName = resolveNavTitleBySegment(currentSegment, parentSegment, byNavUrl);
    });
  }

  const first = classifyList[0];
  if (first) {
    const topRefUrl =
      normalizeUrl(first.url) ||
      normalizeUrl(classifyList[1]?.url || "") ||
      normalizeUrl(route.path || "");
    first.fileName = resolveFirstSegmentTitle(topRefUrl, first.fileName, first.fileName);
  }

  // 最后一项在存在目录页链接时也允许点击，便于回到当前文章所属目录页
  return classifyList.map(({ fileName, url }) => ({
    fileName,
    url,
  }));
});
</script>

<template>
  <div v-if="breadcrumb?.enabled" :class="ns.b()" role="navigation" :aria-label="t('tk.articleBreadcrumb.label')">
    <TkBreadcrumb :separator="breadcrumb.separator">
      <TkBreadcrumbItem>
        <a
          :href="withBase('/')"
          :title="breadcrumb.homeLabel"
          class="home hover-color"
          :aria-label="breadcrumb.homeLabel"
        >
          <TkIcon :icon="houseIcon" aria-hidden="true" />
        </a>
      </TkBreadcrumbItem>
      <TkBreadcrumbItem v-for="(item, index) in breadcrumbList" :key="index">
        <component
          :is="item.url ? 'a' : 'span'"
          :href="item.url && withBase(`${item.url}`)"
          :title="item.fileName"
          :class="[item.url ? 'hover-color' : '']"
          :aria-label="item.fileName"
        >
          {{ item.fileName }}
        </component>
      </TkBreadcrumbItem>
    </TkBreadcrumb>
  </div>
</template>

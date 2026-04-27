<script setup lang="ts" name="ArticleOverviewPage">
import type { Category, DocDocAnalysisFileInfo } from "@teek/config";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { getScrollOffset, withBase, useData } from "vitepress";
import { formatDate } from "@teek/helper";
import { useNamespace, useLocale } from "@teek/composables";
import { usePosts, useTeekConfig } from "@teek/components/theme/ConfigProvider";
import { TkArticlePage } from "@teek/components/common/ArticlePage";
import { createDynamicComponent } from "@teek/components/theme/ArticleTitle";
import { articlePageOutlineKey, type MenuItem } from "@teek/components/common/ArticlePage/src/components/outline";

defineOptions({ name: "ArticleOverviewPage" });

const ns = useNamespace("article-overview");
const { t } = useLocale();
const posts = usePosts();
const { localeIndex, site, theme, frontmatter } = useData();
const { getTeekConfigRef } = useTeekConfig();

const categoryConfig = getTeekConfigRef<Required<Category>>("category", {
  path: "/categories",
});

const categories = computed(() => posts.value.groupPosts.categories);
const eachFileWords = computed<DocDocAnalysisFileInfo[]>(() => theme.value.docAnalysisInfo?.eachFileWords || []);
const overviewTitle = computed(() => t("tk.articleOverview.overview"));
const rowHeight = 44;
const sectionBaseHeight = 164;
const sectionOverscan = 960;

const virtualListRef = ref<HTMLElement | null>(null);
const viewportHeight = ref(0);
const pageScrollTop = ref(0);
const containerTop = ref(0);
const sectionHeightMap = ref<Record<string, number>>({});

let resizeObserver: ResizeObserver | null = null;
let rafId = 0;

// 分类页链接
const categoriesPageLink = computed(() => {
  const localeIndexConst = localeIndex.value;
  const localeName = localeIndexConst !== "root" ? `/${localeIndexConst}` : "";
  // 兼容国际化功能，如果没有配置多语言，则返回 '/categories'
  return `${localeName}${categoryConfig.value.path}${site.value.cleanUrls ? "" : ".html"}`;
});

const eachFileWordsMap = computed(() => {
  const map = new Map<string, DocDocAnalysisFileInfo>();

  eachFileWords.value.forEach(item => {
    const path = "/" + item.fileInfo.relativePath.replace(".md", "");
    map.set(path, item);
    map.set(`${path}.html`, item);
  });

  return map;
});

const getFileWords = (url: string) => {
  return eachFileWordsMap.value.get(url);
};

const getOverviewId = (_name: string, index: number) => {
  return `article-overview-${index + 1}`;
};

const estimateSectionHeight = (rowCount: number) => {
  return sectionBaseHeight + Math.max(rowCount, 1) * rowHeight;
};

const enhancedCategories = computed(() => {
  return (
    Object.entries(categories.value)
      .map(([key, items], index) => ({
        id: getOverviewId(key, index),
        name: key,
        sectionTitle: `${key} ${overviewTitle.value}`,
        data: (items as any[]).map(item => {
            const wordsInfo = getFileWords(item.url);
            return {
              ...item,
              wordCount: wordsInfo?.wordCount || "-",
              readingTime: wordsInfo?.readingTime || "-",
            };
          }),
      }))
      // 获取每个目录的第一篇文章发布时间，然后进行排序，发布时间越晚，优先级越高
      .sort(
        (a, b) =>
          new Date(b.data[b.data.length - 1].date).getTime() - new Date(a.data[a.data.length - 1].date).getTime()
      )
  );
});

const sectionMetrics = computed(() => {
  let top = 0;

  return enhancedCategories.value.map(item => {
    const height = sectionHeightMap.value[item.id] || estimateSectionHeight(item.data.length);
    const section = {
      ...item,
      top,
      height,
      bottom: top + height,
    };

    top += height;
    return section;
  });
});

const virtualTotalHeight = computed(() => {
  const last = sectionMetrics.value[sectionMetrics.value.length - 1];
  return last ? last.bottom : 0;
});

const visibleSections = computed(() => {
  if (!sectionMetrics.value.length) return [];
  if (!virtualListRef.value) return sectionMetrics.value.slice(0, 8);

  const start = Math.max(pageScrollTop.value - containerTop.value - sectionOverscan, 0);
  const end = pageScrollTop.value - containerTop.value + viewportHeight.value + sectionOverscan;

  return sectionMetrics.value.filter(item => item.bottom >= start && item.top <= end);
});

const customOutlineHeaders = computed<MenuItem[]>(() =>
  enhancedCategories.value.map(item => ({
    title: item.sectionTitle,
    link: `#${item.id}`,
    level: 2,
    element: null,
    children: [],
  }))
);

const getActiveOutlineLink = () => {
  if (!sectionMetrics.value.length) return null;

  const scrollY = pageScrollTop.value;
  const innerHeight = viewportHeight.value;
  const offsetHeight = document.body.offsetHeight;
  const isBottom = Math.abs(scrollY + innerHeight - offsetHeight) < 1;

  if (scrollY < 1) return null;
  if (isBottom) return `#${sectionMetrics.value[sectionMetrics.value.length - 1].id}`;

  let activeLink: string | null = null;
  for (const item of sectionMetrics.value) {
    if (containerTop.value + item.top > scrollY + getScrollOffset() + 4) break;
    activeLink = `#${item.id}`;
  }

  return activeLink;
};

const scrollToOutlineLink = (link: string) => {
  const target = sectionMetrics.value.find(item => `#${item.id}` === link);
  if (!target) return;

  const top = Math.max(containerTop.value + target.top - getScrollOffset() - 8, 0);
  window.scrollTo({ top, behavior: "smooth" });
};

provide(articlePageOutlineKey, {
  headers: customOutlineHeaders,
  getActiveLink: getActiveOutlineLink,
  scrollToLink: scrollToOutlineLink,
});

const syncMetrics = () => {
  if (typeof window === "undefined") return;

  pageScrollTop.value = window.scrollY;
  viewportHeight.value = window.innerHeight;

  if (!virtualListRef.value) return;

  const rect = virtualListRef.value.getBoundingClientRect();
  containerTop.value = rect.top + window.scrollY;
};

const requestSyncMetrics = () => {
  if (rafId) return;

  rafId = window.requestAnimationFrame(() => {
    rafId = 0;
    syncMetrics();
  });
};

const updateSectionHeight = (id: string, height: number) => {
  if (!height || Math.abs((sectionHeightMap.value[id] || 0) - height) < 1) return;

  sectionHeightMap.value = {
    ...sectionHeightMap.value,
    [id]: height,
  };
  requestSyncMetrics();
};

const setSectionRef = (id: string, element: Element | null) => {
  const el = element as HTMLElement | null;
  if (!el) return;

  updateSectionHeight(id, el.offsetHeight);
  resizeObserver?.observe(el);
};

onMounted(() => {
  syncMetrics();

  resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
      const id = (entry.target as HTMLElement).dataset.overviewId;
      if (id) updateSectionHeight(id, entry.contentRect.height);
    });
  });

  window.addEventListener("scroll", requestSyncMetrics, { passive: true });
  window.addEventListener("resize", requestSyncMetrics, { passive: true });
});

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
  window.removeEventListener("scroll", requestSyncMetrics);
  window.removeEventListener("resize", requestSyncMetrics);
  resizeObserver?.disconnect();
});

watch(
  enhancedCategories,
  async () => {
    await nextTick();
    requestSyncMetrics();
  },
  { immediate: true }
);

const formatPublishDate = (date?: string) => {
  const publishDateFormat = frontmatter.value.publishDateFormat;

  if (!publishDateFormat) return date;
  return formatDate(date || new Date(), publishDateFormat);
};
</script>

<template>
  <TkArticlePage doc aside :class="ns.b()">
    <h1 v-if="frontmatter.title">
      {{ frontmatter.title }}
      <a class="header-anchor" :href="`#${frontmatter.title}`" :aria-label="`Permalink to '${frontmatter.title}'`" />
    </h1>

    <Content />

    <div ref="virtualListRef" :class="ns.e('virtual-list')" :style="{ height: `${virtualTotalHeight}px` }">
      <section
        v-for="item in visibleSections"
        :key="item.id"
        :id="item.id"
        :data-overview-id="item.id"
        :class="ns.e('virtual-section')"
        :style="{ transform: `translateY(${item.top}px)` }"
        :ref="el => setSectionRef(item.id, el)"
      >
        <h2>
          {{ item.sectionTitle }}
          <a class="header-anchor" :href="`#${item.id}`" :aria-label="`Permalink to '${item.sectionTitle}'`" />
        </h2>

        <a :href="`${categoriesPageLink}?category=${item.name}`" :aria-describedby="`overview-title`">
          {{ item.name }} {{ t("tk.articleOverview.category") }}
        </a>
        <table :aria-describedby="`overview-title`">
          <thead>
            <tr>
              <th>{{ t("tk.articleOverview.name") }}</th>
              <th>{{ t("tk.articleOverview.title") }}</th>
              <th>{{ t("tk.articleOverview.date") }}</th>
              <th>{{ t("tk.articleOverview.wordCount") }}</th>
              <th>{{ t("tk.articleOverview.readingTime") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="data in item.data" :key="data.url">
              <td>{{ item.name }}</td>
              <td>
                <a :href="data.url && withBase(data.url)" :aria-label="data.title">
                  <component v-if="data.title" :is="createDynamicComponent(data.title)" />
                </a>
              </td>
              <td>{{ formatPublishDate(data.date) }}</td>
              <td>{{ data.wordCount }}</td>
              <td>{{ data.readingTime }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </TkArticlePage>
</template>

<script setup lang="ts" name="ArchivesPage">
import { withBase, useData } from "vitepress";
import { computed, onMounted, ref, watch } from "vue";
import { useNamespace, useLocale, useWindowTransition } from "@teek/composables";
import { useWindowTransitionConfig, usePosts } from "@teek/components/theme/ConfigProvider";
import { TkArticlePage } from "@teek/components/common/ArticlePage";
import { TkArticleTitle } from "@teek/components/theme/ArticleTitle";

defineOptions({ name: "ArchivesPage" });

const ns = useNamespace("archives");
const { t } = useLocale();

const { frontmatter } = useData();

const posts = usePosts();

const defaultLabel = computed(() => {
  const frontmatterConst = frontmatter.value;
  return {
    title: frontmatterConst.title ?? t("tk.archives.title"),
    totalCount: frontmatterConst.totalCount ?? t("tk.archives.totalCount"),
    year: frontmatterConst.year ?? t("tk.archives.year"),
    month: frontmatterConst.month ?? t("tk.archives.month"),
    count: frontmatterConst.count ?? t("tk.archives.count"),
    notFound: frontmatterConst.notFound ?? t("tk.archives.notFound"),
  };
});

function parseSortValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : -1;
}

const timelineYears = computed(() =>
  Object.entries(posts.groupPostsByYearMonth || {})
    .sort(([yearA], [yearB]) => parseSortValue(yearB) - parseSortValue(yearA))
    .map(([year, monthPosts]) => ({
      key: String(year),
      year,
      yearCount: posts.groupPostsByYear[year]?.length ?? 0,
      months: Object.entries(monthPosts || {})
        .sort(([monthA], [monthB]) => parseSortValue(monthB) - parseSortValue(monthA))
        .map(([month, monthItems]) => ({
          key: `${year}-${month}`,
          month,
          items: monthItems,
        })),
    }))
);

const expandedMonths = ref<Record<string, boolean>>({});

watch(
  timelineYears,
  years => {
    const nextExpandedMonths: Record<string, boolean> = {};

    years.forEach((yearGroup, yearIndex) => {
      yearGroup.months.forEach((monthGroup, monthIndex) => {
        nextExpandedMonths[monthGroup.key] = expandedMonths.value[monthGroup.key] ?? (yearIndex === 0 && monthIndex === 0);
      });
    });

    expandedMonths.value = nextExpandedMonths;
  },
  { immediate: true }
);

function toggleMonth(key: string) {
  expandedMonths.value[key] = !expandedMonths.value[key];
}

// 屏幕加载元素时，开启过渡动画
const windowTransition = useWindowTransitionConfig(config => config.archives);
const timelineItemListInstance = ref<HTMLLIElement[] | null>(null);
const { start } = useWindowTransition(timelineItemListInstance, false);

onMounted(() => {
  windowTransition.value && start();
});
</script>

<template>
  <TkArticlePage :class="ns.b()" :aria-label="t('tk.archives.label')">
    <slot name="teek-archives-top-before" />

    <div :class="`${ns.e('header')} flx-justify-between`">
      <h1>{{ defaultLabel.title }}</h1>
      <div class="count">
        {{ defaultLabel.totalCount.replace("{count}", posts.sortPostsByDate.length) }}
      </div>
    </div>

    <slot name="teek-archives-top-after" />

    <div class="vp-doc">
      <Content />
    </div>

    <div :class="ns.e('timeline')">
      <template v-for="yearGroup in timelineYears" :key="yearGroup.key">
        <div :class="`${ns.em('timeline', 'year')} flx-justify-between`">
          <div class="year">
            {{ String(yearGroup.year).trim() === "NaN" ? defaultLabel.notFound : String(yearGroup.year).trim() + defaultLabel.year }}
          </div>
          <div class="count">{{ yearGroup.yearCount + defaultLabel.count }}</div>
        </div>

        <div :class="ns.e('timeline__m')">
          <template v-for="monthGroup in yearGroup.months" :key="monthGroup.key">
            <section class="archives-month">
              <button
                type="button"
                :class="[ns.em('timeline__m', 'month'), 'flx-justify-between', { 'is-open': expandedMonths[monthGroup.key] }]"
                :aria-expanded="expandedMonths[monthGroup.key] ? 'true' : 'false'"
                @click="toggleMonth(monthGroup.key)"
              >
                <div class="month-main">
                  <span class="month-dot"></span>
                  <span class="month">
                    {{ String(monthGroup.month) === "NaN" ? defaultLabel.notFound : monthGroup.month + defaultLabel.month }}
                  </span>
                </div>
                <div class="month-meta">
                  <span class="count">{{ monthGroup.items.length + defaultLabel.count }}</span>
                  <span class="arrow"></span>
                </div>
              </button>

              <Transition name="archives-month-collapse">
                <ul v-if="expandedMonths[monthGroup.key]" class="month-posts">
                  <li ref="timelineItemListInstance" v-for="item in monthGroup.items" :key="item.url">
                    <a :href="item.url && withBase(item.url)" :aria-label="`${item.title}`">
                      <span class="date">{{ item.date?.slice(5, 10) }}</span>
                      <TkArticleTitle :post="item" :title-tag-props="{ position: 'right', size: 'small' }" />
                    </a>
                  </li>
                </ul>
              </Transition>
            </section>
          </template>
        </div>
      </template>
    </div>
  </TkArticlePage>
</template>

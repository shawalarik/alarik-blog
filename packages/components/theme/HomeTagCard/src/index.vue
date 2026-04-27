<script setup lang="ts" name="HomeTagCard">
import type { Tag } from "@teek/config";
import { watch, computed, ref, inject, onMounted, onUnmounted } from "vue";
import { useRouter, withBase } from "vitepress";
import { useNamespace, useLocale, useVpRouter } from "@teek/composables";
import { tagIcon } from "@teek/static";
import { isFunction } from "@teek/helper";
import { pageNumKey } from "@teek/components/theme/HomePostList";
import { useTeekConfig, usePagePath, usePosts, useTagColor } from "@teek/components/theme/ConfigProvider";
import { ensureRouteQueryObserver, postDataUpdateSymbol, routeQueryChangeEvent } from "@teek/components/theme/Home/src/home";
import { TkPageCard } from "@teek/components/common/PageCard";

defineOptions({ name: "HomeTagCard" });

const ns = useNamespace("tag");
const { t } = useLocale();
const { getTeekConfigRef } = useTeekConfig();
const { tagsPage = false } = defineProps<{ tagsPage?: boolean }>();
const { route, bindAfterRouteChange } = useVpRouter();

const pageNum = ref(1);
// 标签配置项
const tagConfig = getTeekConfigRef<Required<Tag>>("tag", {
  pageTitle: t("tk.tagCard.pageTitle", { icon: tagIcon }),
  homeTitle: t("tk.tagCard.homeTitle", { icon: tagIcon }),
  emptyLabel: t("tk.tagCard.emptyLabel"),
  moreLabel: t("tk.tagCard.moreLabel"),
  limit: 21,
  autoPage: false,
  pageSpeed: 4000,
  bgColor: "",
});

const { tagPath } = usePagePath();
const posts = usePosts();
const tagColor = useTagColor();

const tags = computed(() => posts.value.groupCards.tags);

// 当前显示的标签，如果是在标签页，则显示所有标签，如果在首页，则显示前 limit 个标签
const currentTags = computed(() => {
  const { limit } = tagConfig.value;
  const t = tags.value;
  const p = pageNum.value;
  return tagsPage ? t : t.slice((p - 1) * limit, p * limit);
});

const finalTitle = computed(() => {
  const { pageTitle, homeTitle } = tagConfig.value;
  const pt = isFunction(pageTitle) ? pageTitle(tagIcon) : pageTitle;
  const ht = isFunction(homeTitle) ? homeTitle(tagIcon) : homeTitle;
  return { pt, ht };
});

const getTagStyle = (index: number) => {
  const tagColorConst = tagColor.value;

  // 标签色
  const color = tagColorConst[index % tagColorConst.length];
  return {
    [ns.cssVarName("home-tag-bg-color")]: color.bg,
    backgroundColor: color.bg,
    color: color.text,
    borderColor: color.border,
  };
};

const updatePostListData = inject(postDataUpdateSymbol, () => {});
const router = useRouter();
const selectedTag = ref("");
const tagKey = "tag";
const showLandingPage = computed(() => tagsPage && !selectedTag.value);
const landingTags = computed(() =>
  [...tags.value].sort((a, b) => b.length - a.length || a.name.localeCompare(b.name))
);
const cloudWords = computed(() => {
  const max = Math.max(...landingTags.value.map(item => item.length), 1);
  const min = Math.min(...landingTags.value.map(item => item.length), max);
  const gap = Math.max(max - min, 1);

  return landingTags.value.map((item, index) => {
    const ratio = (item.length - min) / gap;
    const fontSize = 16 + ratio * 22;
    const color = tagColor.value[index % tagColor.value.length];

    return {
      ...item,
      style: {
        fontSize: `${fontSize}px`,
        color: color.text,
        textShadow: "0 8px 18px rgba(148, 163, 184, 0.12)",
      },
    };
  });
});

const syncSelectedTag = () => {
  if (typeof window === "undefined") return;
  const { searchParams } = new URL(window.location.href);
  selectedTag.value = searchParams.get(tagKey) || "";
};

/**
 * 点击分类，更新文章列表数据
 */
const handleSwitchTag = (tag = "") => {
  const { pathname, searchParams } = new URL(window.location.href);
  const categoriesPageLinkConst = withBase(tagPath.value);
  const inCategoriesPage = categoriesPageLinkConst === pathname;

  // 先删除旧的参数再追加新的
  searchParams.delete(pageNumKey);
  searchParams.append(pageNumKey, "1");
  searchParams.delete(tagKey);
  if (tag) searchParams.append(tagKey, tag);

  const searchParamsStr = tag ? `?${searchParams.toString()}` : "";

  // 避免重复点击
  if (inCategoriesPage && selectedTag.value === tag) return;
  selectedTag.value = tag;

  // 如果此时不在分类页，则跳转至分类页
  if (!inCategoriesPage) return router.go(categoriesPageLinkConst + searchParamsStr);

  // 如果在分类页，则替换 URL，但不刷新
  window.history.pushState({}, "", pathname + searchParamsStr);
  // 更新文章列表数据
  updatePostListData();
};

onMounted(() => {
  ensureRouteQueryObserver();
  syncSelectedTag();
  window.addEventListener(routeQueryChangeEvent, syncSelectedTag);
});

watch(
  () => tagsPage,
  () => {
    // 离开分类页后，激活状态清楚
    if (!tagsPage) {
      selectedTag.value = "";
      return;
    }
    syncSelectedTag();
  }
);

watch(() => route.path, syncSelectedTag, { immediate: true });
bindAfterRouteChange("home-tag-card-route-query-sync", syncSelectedTag);

onUnmounted(() => {
  window.removeEventListener(routeQueryChangeEvent, syncSelectedTag);
});
</script>

<template>
  <div v-if="showLandingPage" :class="[ns.b(), ns.is('page', true), ns.is('landing', true)]" :aria-label="t('tk.tagCard.label')">
    <section :class="ns.e('landing-panel')">
      <h3 :class="ns.e('landing-title')">标签云</h3>
      <div v-if="cloudWords.length" :class="ns.e('cloud')" :aria-label="t('tk.tagCard.listLabel')">
        <a
          v-for="item in cloudWords"
          :key="`cloud-${item.name}`"
          :class="[ns.e('cloud-item'), ns.join('pointer')]"
          :style="item.style"
          :aria-label="item.name"
          @click="handleSwitchTag(item.name)"
        >
          {{ item.name }}
        </a>
      </div>
      <div v-else :class="ns.m('empty')" :aria-label="tagConfig.emptyLabel">{{ tagConfig.emptyLabel }}</div>
    </section>

    <section :class="ns.e('landing-panel')">
      <h3 :class="ns.e('landing-title')">全部标签</h3>
      <div v-if="landingTags.length" :class="ns.e('list')" :aria-label="t('tk.tagCard.listLabel')">
        <a
          v-for="(item, index) in landingTags"
          :key="item.name"
          :style="getTagStyle(index)"
          @click="handleSwitchTag(item.name)"
          :class="[{ active: item.name === selectedTag }, ns.join('pointer')]"
          :aria-label="item.name"
        >
          <span>{{ item.name }}</span>
          <span class="num">{{ item.length }}</span>
        </a>
      </div>
      <div v-else :class="ns.m('empty')" :aria-label="tagConfig.emptyLabel">{{ tagConfig.emptyLabel }}</div>
    </section>
  </div>

  <TkPageCard
    v-else
    :page="!tagsPage"
    v-model="pageNum"
    :pageSize="tagConfig.limit"
    :total="tags.length"
    :title="finalTitle[tagsPage ? 'pt' : 'ht']"
    :titleClick="handleSwitchTag"
    :autoPage="tagConfig.autoPage"
    :pageSpeed="tagConfig.pageSpeed"
    :class="[ns.b(), ns.is('page', tagsPage)]"
    :aria-label="t('tk.tagCard.label')"
  >
    <template #default="{ transitionName }">
      <TransitionGroup
        v-if="tags.length"
        :name="transitionName"
        tag="div"
        mode="out-in"
        :class="ns.e('list')"
        :aria-label="t('tk.tagCard.listLabel')"
      >
        <a
          v-for="(item, index) in currentTags"
          :key="item.name"
          :style="getTagStyle(index)"
          @click="handleSwitchTag(item.name)"
          :class="[{ active: item.name === selectedTag }, ns.join('pointer')]"
          :aria-label="item.name"
        >
          <span>{{ item.name }}</span>
          <span class="num">{{ item.length }}</span>
        </a>

        <a
          v-if="!tagsPage && tagConfig.limit < tags.length"
          :href="withBase(tagPath)"
          class="more"
          :aria-label="tagConfig.moreLabel"
        >
          {{ tagConfig.moreLabel }}
        </a>
      </TransitionGroup>

      <div v-else :class="ns.m('empty')" :aria-label="tagConfig.emptyLabel">{{ tagConfig.emptyLabel }}</div>
    </template>
  </TkPageCard>
</template>

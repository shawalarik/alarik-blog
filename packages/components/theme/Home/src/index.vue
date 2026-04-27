<script setup lang="ts" name="Home">
import type { TeekConfig } from "@teek/config";
import type { TkHomePostListInstance } from "@teek/components";
import { computed, onMounted, onUnmounted, provide, ref, watch } from "vue";
import { useData } from "vitepress";
import { useNamespace, useLocale, useVpRouter } from "@teek/composables";
import { useTeekConfig, usePageState } from "@teek/components/theme/ConfigProvider";
import { TkHomeFullscreenWallpaper } from "@teek/components/theme/HomeFullscreenWallpaper";
import { TkHomePostList } from "@teek/components/theme/HomePostList";
import { TkHomeBanner } from "@teek/components/theme/HomeBanner";
import { TkHomeCardList } from "@teek/components/theme/HomeCardList";
import { TkHomeCategoryCard } from "@teek/components/theme/HomeCategoryCard";
import { TkHomeTagCard } from "@teek/components/theme/HomeTagCard";
import { TkFooterInfo } from "@teek/components/theme/FooterInfo";
import { categoryPageQuerySyncSymbol, ensureRouteQueryObserver, postDataUpdateSymbol, routeQueryChangeEvent } from "./home";

defineOptions({ name: "Home" });

const ns = useNamespace("home");
const { t } = useLocale();
const { theme, frontmatter } = useData();

const { isHomePage, isCategoriesPage, isTagsPage } = usePageState();
const { getTeekConfigRef } = useTeekConfig();
const { route, bindAfterRouteChange } = useVpRouter();

const teekConfig = getTeekConfigRef<Required<TeekConfig>>(null, {
  teekHome: true,
  homeCardListPosition: "right",
  banner: {},
  wallpaper: {},
  bodyBgImg: {},
});

const homePostListInstance = ref<TkHomePostListInstance | null>(null);
const selectedCategory = ref("");
const selectedTag = ref("");

const syncSelectedCategory = () => {
  if (typeof window === "undefined") return;
  const { searchParams } = new URL(window.location.href);
  selectedCategory.value = searchParams.get("category") || "";
};

const syncSelectedTag = () => {
  if (typeof window === "undefined") return;
  const { searchParams } = new URL(window.location.href);
  selectedTag.value = searchParams.get("tag") || "";
};

provide(categoryPageQuerySyncSymbol, syncSelectedCategory);
provide(postDataUpdateSymbol, () => {
  syncSelectedCategory();
  syncSelectedTag();
  homePostListInstance.value?.updateData();
});

// 翻页 > 1 则隐藏 Banner
const isPaging = ref(false);
const assetMeta = computed(() => theme.value.assetMeta || {});
const showCategoriesLanding = computed(() => isCategoriesPage.value && !selectedCategory.value);
const showCategoriesResult = computed(() => isCategoriesPage.value && !!selectedCategory.value);
const showTagsLanding = computed(() => isTagsPage.value && !selectedTag.value);
const showTagsResult = computed(() => isTagsPage.value && !!selectedTag.value);
const categoryPageTitle = computed(() => frontmatter.value.title || "文章分类");
const categoryResultTitle = computed(() => (selectedCategory.value ? `分类：${selectedCategory.value}` : categoryPageTitle.value));
const tagPageTitle = computed(() => frontmatter.value.title || "文章标签");
const tagResultTitle = computed(() => (selectedTag.value ? `标签：${selectedTag.value}` : tagPageTitle.value));
const getAssetImage = (dir: string, prefix: string, totalCount: unknown, seedSource: string, fallbackDir?: string, fallbackCount?: unknown) => {
  const cdnBase = assetMeta.value.cdnBase || "";
  if (!cdnBase) return "";

  const total = Number(totalCount) || 0;
  const hash = Array.from(seedSource).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  if (total > 0) {
    const index = (hash % total) + 1;
    return `${cdnBase}/${dir}/${prefix}${index}.jpg`;
  }

  const fallbackTotal = Number(fallbackCount) || 0;
  if (fallbackDir && fallbackTotal > 0) {
    const index = (hash % fallbackTotal) + 1;
    return `${cdnBase}/${fallbackDir}/cover${index}.jpg`;
  }

  return "";
};
const categoryHeroBackground = computed(() => {
  const seedSource = frontmatter.value.permalink || frontmatter.value.path || categoryPageTitle.value || "categories";
  return getAssetImage("hero", "hero", assetMeta.value.heroCount, seedSource, "cover", assetMeta.value.coverCount);
});
const categoryResultHeroBackground = computed(() => {
  const seedSource = selectedCategory.value || frontmatter.value.permalink || frontmatter.value.path || "category-result";
  return getAssetImage("hero", "hero", assetMeta.value.heroCount, seedSource, "cover", assetMeta.value.coverCount);
});
const tagHeroBackground = computed(() => {
  const seedSource = frontmatter.value.permalink || frontmatter.value.path || tagPageTitle.value || "tags";
  return getAssetImage("hero", "hero", assetMeta.value.heroCount, seedSource, "cover", assetMeta.value.coverCount);
});
const tagResultHeroBackground = computed(() => {
  const seedSource = selectedTag.value || frontmatter.value.permalink || frontmatter.value.path || "tag-result";
  return getAssetImage("hero", "hero", assetMeta.value.heroCount, seedSource, "cover", assetMeta.value.coverCount);
});

onMounted(() => {
  ensureRouteQueryObserver();
  syncSelectedCategory();
  syncSelectedTag();
  window.addEventListener("popstate", syncSelectedCategory);
  window.addEventListener("popstate", syncSelectedTag);
  window.addEventListener(routeQueryChangeEvent, syncSelectedCategory);
  window.addEventListener(routeQueryChangeEvent, syncSelectedTag);
});

watch(() => route.path, syncSelectedCategory, { immediate: true });
watch(() => route.path, syncSelectedTag, { immediate: true });
bindAfterRouteChange("home-route-query-sync", syncSelectedCategory);
bindAfterRouteChange("home-tag-route-query-sync", syncSelectedTag);

onUnmounted(() => {
  window.removeEventListener("popstate", syncSelectedCategory);
  window.removeEventListener("popstate", syncSelectedTag);
  window.removeEventListener(routeQueryChangeEvent, syncSelectedCategory);
  window.removeEventListener(routeQueryChangeEvent, syncSelectedTag);
});
</script>

<template>
  <div
    :class="[
      ns.b(),
      ns.is('categories-page', isCategoriesPage),
      ns.is('categories-landing', showCategoriesLanding),
      ns.is('tags-page', isTagsPage),
      ns.is('tags-landing', showTagsLanding),
    ]"
    role="main"
    :aria-label="t('tk.home.label')"
  >
    <template v-if="showCategoriesLanding">
      <section
        :class="ns.e('hero')"
        :style="categoryHeroBackground ? { backgroundImage: `url(${categoryHeroBackground})` } : undefined"
      >
        <div :class="ns.e('hero-mask')" />
        <div :class="ns.e('hero-content')">
          <h1>{{ categoryPageTitle }}</h1>
        </div>
      </section>

      <div :class="ns.e('landing')">
        <div :class="ns.e('landing-inner')">
          <TkHomeCategoryCard categoriesPage />
        </div>

        <TkFooterInfo :class="ns.e('landing-footer')" />
      </div>
    </template>

    <template v-else-if="showTagsLanding">
      <section
        :class="ns.e('hero')"
        :style="tagHeroBackground ? { backgroundImage: `url(${tagHeroBackground})` } : undefined"
      >
        <div :class="ns.e('hero-mask')" />
        <div :class="ns.e('hero-content')">
          <h1>{{ tagPageTitle }}</h1>
        </div>
      </section>

      <div :class="ns.e('landing')">
        <div :class="[ns.e('landing-inner'), ns.is('tags-landing-inner', true)]">
          <TkHomeTagCard tagsPage />
        </div>

        <TkFooterInfo :class="ns.e('landing-footer')" />
      </div>
    </template>

    <template v-else>
      <section
        v-if="showCategoriesResult || showTagsResult"
        :class="[ns.e('hero'), ns.is('result-hero', true)]"
        :style="
          showCategoriesResult
            ? (categoryResultHeroBackground ? { backgroundImage: `url(${categoryResultHeroBackground})` } : undefined)
            : (tagResultHeroBackground ? { backgroundImage: `url(${tagResultHeroBackground})` } : undefined)
        "
      >
        <div :class="ns.e('hero-mask')" />
        <div :class="ns.e('hero-content')">
          <h1>{{ showCategoriesResult ? categoryResultTitle : tagResultTitle }}</h1>
        </div>
      </section>

      <div v-if="isHomePage && (teekConfig.banner.enabled ?? true)" v-show="!isPaging">
        <TkHomeBanner :disabled="isPaging">
          <template v-for="(_, name) in $slots" :key="name" #[name]="scope">
            <slot :name="name" v-bind="scope" />
          </template>
        </TkHomeBanner>
      </div>

      <div
        :class="[
          ns.e('content'),
          ns.join('wallpaper-outside'),
          'flx-start-justify-center',
          ns.is('categories-result', showCategoriesResult),
          ns.is('tags-result', showTagsResult),
        ]"
      >
        <div :class="ns.e('content__post')" :aria-label="t('tk.home.postLabel')">
          <slot name="teek-home-post-before" />
          <TkHomePostList v-model="isPaging" ref="homePostListInstance">
            <template v-for="(_, name) in $slots" :key="name" #[name]="scope">
              <slot :name="name" v-bind="scope" />
            </template>
          </TkHomePostList>
          <slot name="teek-home-post-after" />
        </div>

        <div
          v-if="teekConfig.homeCardListPosition && !showCategoriesResult && !showTagsResult"
          :class="[ns.e('content__info'), teekConfig.homeCardListPosition === 'left' ? ns.is('left') : ns.is('right')]"
          :aria-label="t('tk.home.cardLabel')"
        >
          <TkHomeCardList>
            <template v-for="(_, name) in $slots" :key="name" #[name]="scope">
              <slot :name="name" v-bind="scope" />
            </template>
          </TkHomeCardList>
        </div>
      </div>

      <TkFooterInfo v-if="showCategoriesResult || showTagsResult" :class="ns.e('result-footer')" />

      <TkHomeFullscreenWallpaper
        v-if="teekConfig.wallpaper.enabled && (teekConfig.banner.bgStyle === 'fullImg' || teekConfig.bodyBgImg.imgSrc)"
      />
    </template>
  </div>
</template>

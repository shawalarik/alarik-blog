<script setup lang="ts" name="HomeCategoryCard">
import type { Category } from "@teek/config";
import { computed, ref, inject, onMounted, onUnmounted, watch } from "vue";
import { useRouter, withBase } from "vitepress";
import { useNamespace, useLocale, useVpRouter } from "@teek/composables";
import { categoryIcon } from "@teek/static";
import { isFunction } from "@teek/helper";
import { pageNumKey } from "@teek/components/theme/HomePostList/src/homePostList";
import { useTeekConfig, usePagePath, usePosts, useTagColor } from "@teek/components/theme/ConfigProvider";
import {
  categoryPageQuerySyncSymbol,
  ensureRouteQueryObserver,
  postDataUpdateSymbol,
  routeQueryChangeEvent,
} from "@teek/components/theme/Home/src/home";
import { TkPageCard } from "@teek/components/common/PageCard";

defineOptions({ name: "HomeCategoryCard" });

const { categoriesPage = false } = defineProps<{ categoriesPage?: boolean }>();

const ns = useNamespace("category");
const { t } = useLocale();
const { getTeekConfigRef } = useTeekConfig();
const { categoryPath } = usePagePath();
const tagColor = useTagColor();
const { route, bindAfterRouteChange } = useVpRouter();

// 分类配置项
const categoryConfig = getTeekConfigRef<Required<Category>>("category", {
  path: "/categories",
  pageTitle: t("tk.categoryCard.pageTitle", { icon: categoryIcon }),
  homeTitle: t("tk.categoryCard.homeTitle", { icon: categoryIcon }),
  emptyLabel: t("tk.categoryCard.emptyLabel"),
  moreLabel: t("tk.categoryCard.moreLabel"),
  limit: 5,
  autoPage: false,
  pageSpeed: 4000,
});

const posts = usePosts();
const pageNum = ref(1);
const categories = computed(() => posts.value.groupCards.categories);

// 当前显示的分类，如果是在分类页，则显示所有分类，如果在首页，则分页显示
const currentCategories = computed(() => {
  const { limit } = categoryConfig.value;
  const c = categories.value;
  const p = pageNum.value;
  return categoriesPage ? c : c.slice((p - 1) * limit, p * limit);
});

// 标题
const finalTitle = computed(() => {
  const { pageTitle, homeTitle } = categoryConfig.value;
  const pt = isFunction(pageTitle) ? pageTitle(categoryIcon) : pageTitle;
  const ht = isFunction(homeTitle) ? homeTitle(categoryIcon) : homeTitle;
  return { pt, ht };
});

const updatePostListData = inject(postDataUpdateSymbol, () => {});
const syncCategoryPageQuery = inject(categoryPageQuerySyncSymbol, () => {});
const router = useRouter();
const selectedCategory = ref("");
const categoryKey = "category";
const radarSize = 320;
const radarLevels = 5;
const radarCenter = radarSize / 2;
const radarRadius = 108;
const isLandingPage = computed(() => categoriesPage && !selectedCategory.value);
const radarCategories = computed(() =>
  [...categories.value].sort((a, b) => b.length - a.length || a.name.localeCompare(b.name)).slice(0, 14)
);
const radarMax = computed(() => Math.max(...radarCategories.value.map(item => item.length), 1));

const syncSelectedCategory = () => {
  if (typeof window === "undefined") return;
  const { searchParams } = new URL(window.location.href);
  selectedCategory.value = searchParams.get(categoryKey) || "";
};

const getCategoryStyle = (index: number) => {
  const color = tagColor.value[index % tagColor.value.length];
  return {
    [ns.cssVarName("category-bg-color")]: color.bg,
    backgroundColor: color.bg,
    color: color.text,
    borderColor: color.border,
    boxShadow: `0 10px 18px -16px ${color.text}`,
  };
};

const getRadarPoint = (index: number, radius: number) => {
  const total = Math.max(radarCategories.value.length, 1);
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: radarCenter + Math.cos(angle) * radius,
    y: radarCenter + Math.sin(angle) * radius,
  };
};

const radarGridPolygons = computed(() =>
  Array.from({ length: radarLevels }, (_, level) =>
    radarCategories.value.map((_, index) => {
      const point = getRadarPoint(index, (radarRadius * (level + 1)) / radarLevels);
      return `${point.x},${point.y}`;
    })
  )
);

const radarAxisLines = computed(() =>
  radarCategories.value.map((_, index) => {
    const point = getRadarPoint(index, radarRadius);
    return { x1: radarCenter, y1: radarCenter, x2: point.x, y2: point.y };
  })
);

const radarPolygonPoints = computed(() =>
  radarCategories.value
    .map((item, index) => {
      const ratio = item.length / radarMax.value;
      const point = getRadarPoint(index, Math.max(ratio * radarRadius, 12));
      return `${point.x},${point.y}`;
    })
    .join(" ")
);

const radarLabels = computed(() =>
  radarCategories.value.map((item, index) => {
    const point = getRadarPoint(index, radarRadius + 24);
    let anchor: "start" | "middle" | "end" = "middle";
    if (point.x < radarCenter - 8) anchor = "end";
    else if (point.x > radarCenter + 8) anchor = "start";

    return { ...item, x: point.x, y: point.y, anchor };
  })
);

/**
 * 点击分类，更新文章列表数据
 */
const handleSwitchCategory = (category = "") => {
  const { pathname, searchParams } = new URL(window.location.href);
  const categoriesPathConst = withBase(categoryPath.value);
  const inCategoriesPage = categoriesPathConst === pathname;

  // 先删除旧的参数再追加新的
  searchParams.delete(pageNumKey);
  searchParams.append(pageNumKey, "1");
  searchParams.delete(categoryKey);
  if (category) searchParams.append(categoryKey, category);

  const searchParamsStr = category ? `?${searchParams.toString()}` : "";

  // 避免重复点击
  if (inCategoriesPage && selectedCategory.value === category) return;
  selectedCategory.value = category;

  // 如果此时不在分类页，则跳转至分类页
  if (!inCategoriesPage) return router.go(categoriesPathConst + searchParamsStr);

  // 如果在分类页，则替换 URL，但不刷新
  window.history.pushState({}, "", pathname + searchParamsStr);
  syncCategoryPageQuery();
  // 更新文章列表数据
  updatePostListData();
};

onMounted(() => {
  ensureRouteQueryObserver();
  syncSelectedCategory();
  window.addEventListener(routeQueryChangeEvent, syncSelectedCategory);
});

watch(
  () => categoriesPage,
  () => {
    // 离开分类页后，激活状态清除
    if (!categoriesPage) {
      selectedCategory.value = "";
      return;
    }
    syncSelectedCategory();
  }
);

watch(() => route.path, syncSelectedCategory, { immediate: true });
bindAfterRouteChange("home-category-route-query-sync", syncSelectedCategory);

onUnmounted(() => {
  window.removeEventListener(routeQueryChangeEvent, syncSelectedCategory);
});

const itemRefs = ref<HTMLLIElement[]>([]);
</script>

<template>
  <div v-if="isLandingPage" :class="[ns.b(), ns.is('landing', true)]" :aria-label="t('tk.categoryCard.label')">
    <section :class="ns.e('landing-panel')">
      <div :class="ns.e('landing-tags')" :aria-label="t('tk.categoryCard.listLabel')">
        <a
          v-for="(item, index) in categories"
          :key="item.name"
          :style="getCategoryStyle(index)"
          :class="ns.e('landing-tag')"
          :aria-label="item.name"
          @click="handleSwitchCategory(item.name)"
        >
          <span>{{ item.name }}</span>
          <span>{{ item.length }}</span>
        </a>
      </div>

      <div v-if="!categories.length" :class="ns.m('empty')" :aria-label="categoryConfig.emptyLabel">
        {{ categoryConfig.emptyLabel }}
      </div>
    </section>

    <section v-if="radarCategories.length" :class="ns.e('landing-panel')">
      <h3 :class="ns.e('radar-title')">文章分类雷达图</h3>
      <div :class="ns.e('radar-wrap')">
        <svg
          :class="ns.e('radar-svg')"
          :viewBox="`0 0 ${radarSize} ${radarSize}`"
          role="img"
          aria-label="文章分类雷达图"
        >
          <g>
            <polygon
              v-for="(polygon, index) in radarGridPolygons"
              :key="`grid-${index}`"
              :points="polygon.join(' ')"
              fill="none"
              stroke="var(--vp-c-divider)"
              stroke-width="1"
            />
          </g>

          <g>
            <line
              v-for="(line, index) in radarAxisLines"
              :key="`line-${index}`"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              stroke="var(--vp-c-divider)"
              stroke-width="1"
            />
          </g>

          <polygon
            :points="radarPolygonPoints"
            fill="rgba(93, 233, 182, 0.22)"
            stroke="rgba(93, 233, 182, 0.92)"
            stroke-width="2"
          />

          <circle
            v-for="(item, index) in radarCategories"
            :key="`point-${item.name}`"
            :cx="getRadarPoint(index, Math.max((item.length / radarMax) * radarRadius, 12)).x"
            :cy="getRadarPoint(index, Math.max((item.length / radarMax) * radarRadius, 12)).y"
            r="3"
            fill="rgba(93, 233, 182, 0.92)"
          />

          <text
            v-for="item in radarLabels"
            :key="`label-${item.name}`"
            :x="item.x"
            :y="item.y"
            :text-anchor="item.anchor"
            dominant-baseline="middle"
          >
            {{ item.name }}
          </text>
        </svg>
      </div>
    </section>
  </div>

  <TkPageCard
    v-else
    :page="!categoriesPage"
    v-model="pageNum"
    :pageSize="categoryConfig.limit"
    :total="categories.length"
    :title="finalTitle[categoriesPage ? 'pt' : 'ht']"
    :titleClick="handleSwitchCategory"
    :autoPage="categoryConfig.autoPage"
    :pageSpeed="categoryConfig.pageSpeed"
    :class="[ns.b(), ns.is('page', categoriesPage)]"
    :aria-label="t('tk.categoryCard.label')"
  >
    <template #default="{ transitionName }">
      <TransitionGroup
        v-if="categories.length"
        :name="transitionName"
        tag="div"
        mode="out-in"
        :class="`${ns.e('list')} flx-column`"
        :aria-label="t('tk.categoryCard.listLabel')"
      >
        <a
          ref="itemRefs"
          v-for="(item, index) in currentCategories"
          :key="item.name"
          @click="handleSwitchCategory(item.name)"
          :class="[{ active: item.name === selectedCategory }, 'hover-color']"
          :style="`top: ${index * itemRefs?.[index]?.getBoundingClientRect().height || 0}px`"
          :aria-label="item.name"
        >
          <span class="sle">{{ item.name }}</span>
          <span>{{ item.length }}</span>
        </a>

        <a
          v-if="!categoriesPage && categoryConfig.limit < categories.length"
          :href="withBase(categoryPath)"
          :aria-label="categoryConfig.moreLabel"
        >
          {{ categoryConfig.moreLabel }}
        </a>
      </TransitionGroup>

      <div v-else :class="ns.m('empty')" :aria-label="categoryConfig.emptyLabel">
        {{ categoryConfig.emptyLabel }}
      </div>
    </template>
  </TkPageCard>
</template>

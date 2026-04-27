<script setup lang="ts" name="DocAsideOutline">
import { onContentUpdated, useData } from "vitepress";
import { computed, inject, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { useNamespace } from "@teek/composables";
import { articlePageOutlineKey, getHeaders, resolveTitle, useActiveAnchor } from "./outline";
import DocAsideOutlineItem from "./DocAsideOutlineItem.vue";

defineOptions({ name: "DocAsideOutline" });

const ns = useNamespace("aside-outline");
const itemNs = useNamespace("aside-outline-item");
const articlePageNs = useNamespace("article-page");
const { frontmatter, theme } = useData();
const customOutline = inject(articlePageOutlineKey, null);

const localHeaders = shallowRef<any[]>([]);
const headers = computed(() => customOutline?.headers.value || localHeaders.value);
const activeCustomLink = ref<string | null>(null);
const outlineScrollTop = ref(0);
const outlineViewportHeight = ref(0);
const outlineScroller = ref<HTMLElement | null>(null);
const virtualItemHeight = 32;
const virtualOverscan = 8;
let outlineRafId = 0;

onContentUpdated(() => {
  if (customOutline) return;
  localHeaders.value = getHeaders(frontmatter.value.outline ?? theme.value.outline);
});

onMounted(() => {
  if (!customOutline && !localHeaders.value?.length) {
    localHeaders.value = getHeaders(frontmatter.value.outline ?? theme.value.outline);
  }
});

const container = ref();
const marker = ref();

if (!customOutline) useActiveAnchor(container, marker);

const flatHeaders = computed(() =>
  headers.value.map((item: any, index: number) => ({
    ...item,
    depth: Math.max((item.level || 2) - 2, 0),
    index,
  }))
);
const shouldVirtualize = computed(() => !!customOutline && flatHeaders.value.length > 40);
const visibleStartIndex = computed(() => {
  if (!shouldVirtualize.value) return 0;
  return Math.max(Math.floor(outlineScrollTop.value / virtualItemHeight) - virtualOverscan, 0);
});
const visibleEndIndex = computed(() => {
  if (!shouldVirtualize.value) return flatHeaders.value.length;
  const viewportCount = Math.ceil(outlineViewportHeight.value / virtualItemHeight) + virtualOverscan * 2;
  return Math.min(visibleStartIndex.value + viewportCount, flatHeaders.value.length);
});
const visibleFlatHeaders = computed(() => flatHeaders.value.slice(visibleStartIndex.value, visibleEndIndex.value));
const virtualPaddingTop = computed(() => visibleStartIndex.value * virtualItemHeight);
const virtualPaddingBottom = computed(() => {
  return Math.max((flatHeaders.value.length - visibleEndIndex.value) * virtualItemHeight, 0);
});

const syncCustomActiveLink = () => {
  if (!customOutline) return;
  activeCustomLink.value = customOutline.getActiveLink();

  requestAnimationFrame(() => {
    const activeLink = activeCustomLink.value
      ? (container.value?.querySelector(`[data-link="${activeCustomLink.value}"]`) as HTMLElement | null)
      : null;

    if (activeLink) {
      marker.value.style.top = activeLink.offsetTop + 39 + "px";
      marker.value.style.opacity = "1";
    } else {
      marker.value.style.top = "33px";
      marker.value.style.opacity = "0";
    }
  });
};

const syncVirtualViewport = () => {
  if (!outlineScroller.value) return;
  outlineScrollTop.value = outlineScroller.value.scrollTop;
  outlineViewportHeight.value = outlineScroller.value.clientHeight;
};

const requestSyncVirtualViewport = () => {
  if (outlineRafId) return;
  outlineRafId = window.requestAnimationFrame(() => {
    outlineRafId = 0;
    syncVirtualViewport();
  });
};

const handleCustomLinkClick = (link: string, event: MouseEvent) => {
  if (!customOutline) return;
  event.preventDefault();
  customOutline.scrollToLink(link);
};

onMounted(() => {
  if (!customOutline) return;

  outlineScroller.value = container.value?.closest(`.${articlePageNs.e("aside__container")}`) || null;
  syncVirtualViewport();
  syncCustomActiveLink();

  window.addEventListener("scroll", syncCustomActiveLink, { passive: true });
  window.addEventListener("resize", requestSyncVirtualViewport, { passive: true });
  outlineScroller.value?.addEventListener("scroll", requestSyncVirtualViewport, { passive: true });
});

onBeforeUnmount(() => {
  if (outlineRafId) cancelAnimationFrame(outlineRafId);
  if (!customOutline) return;

  window.removeEventListener("scroll", syncCustomActiveLink);
  window.removeEventListener("resize", requestSyncVirtualViewport);
  outlineScroller.value?.removeEventListener("scroll", requestSyncVirtualViewport);
});

watch(headers, () => {
  if (!customOutline) return;
  requestSyncVirtualViewport();
  syncCustomActiveLink();
});
</script>

<template>
  <nav
    aria-labelledby="doc-outline-aria-label"
    :class="[ns.b(), { 'has-outline': headers.length > 0 }]"
    ref="container"
  >
    <div :class="ns.e('content')">
      <div :class="ns.m('marker')" ref="marker" />

      <div id="doc-outline-aria-label" aria-level="2" :class="ns.m('title')" role="heading">
        {{ resolveTitle(theme) }}
      </div>

      <template v-if="shouldVirtualize">
        <div :class="ns.e('virtual')" :style="{ paddingTop: `${virtualPaddingTop}px`, paddingBottom: `${virtualPaddingBottom}px` }">
          <a
            v-for="item in visibleFlatHeaders"
            :key="item.link"
            :href="item.link"
            :data-link="item.link"
            :title="item.title"
            :class="[ns.e('virtual-link'), itemNs.m('link'), { active: item.link === activeCustomLink }]"
            :style="{ paddingLeft: `${item.depth * 16}px` }"
            @click="handleCustomLinkClick(item.link, $event)"
          >
            {{ item.title }}
          </a>
        </div>
      </template>

      <DocAsideOutlineItem v-else :headers="headers" :root="true" />
    </div>
  </nav>
</template>

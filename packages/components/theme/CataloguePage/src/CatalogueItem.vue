<script setup lang="ts" name="CatalogueItem">
import type { CatalogueItem } from "@teek/config";
import { ref, computed, watch } from "vue";
import { withBase } from "vitepress";
import { useNamespace } from "@teek/composables";
import { TkTitleTag } from "@teek/components/common/TitleTag";

defineOptions({ name: "CatalogueItem" });

const props = defineProps<{ item: CatalogueItem; index: number | string }>();

const nsSub = useNamespace("sub-catalogue");
const nsItem = useNamespace("catalogue-item");

// 折叠状态：有子项的目录默认收起
const isExpanded = ref(false);

const hasChildren = computed(() => props.item.children && props.item.children.length > 0);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

// 监听全局展开/折叠信号
watch(
  () => (window as any).__catalogue_collapse_key__,
  () => {
    if (hasChildren.value) {
      isExpanded.value = !!(window as any).__catalogue_force_expand__;
    }
  }
);
</script>

<template>
  <li :class="hasChildren ? nsSub.b() : nsItem.b()">
    <!-- 叶子节点：直接链接 -->
    <a v-if="!hasChildren" :href="item.url && withBase(item.url)" :aria-label="`${index}. ${item.title}`">
      <span class="catalogue-item__index">{{ index }}.</span>
      <span v-html="item.title" class="catalogue-item__title" />
      <TkTitleTag
        v-if="item.frontmatter?.titleTag"
        :text="item.frontmatter?.titleTag"
        position="right"
        size="small"
        :aria-label="item.frontmatter?.titleTag"
      />
    </a>

    <!-- 目录节点：可折叠 -->
    <div v-else class="catalogue-group" :class="{ 'is-expanded': isExpanded }">
      <!-- 分组标题（可点击切换） -->
      <div class="catalogue-group__header" @click="toggleExpand">
        <span class="catalogue-group__arrow" :class="{ 'is-expanded': isExpanded }">▶</span>
        <span class="catalogue-group__title">{{ `${index}. ${item.title}` }}</span>
        <span class="catalogue-group__count">{{ item.children!.length }} 篇</span>
      </div>

      <!-- 子列表（带过渡动画） -->
      <Transition name="catalogue-collapse">
        <ul v-show="isExpanded" class="catalogue-group__children">
          <CatalogueItem v-for="(child, i) in item.children" :key="i" :item="child" :index="`${index}-${i + 1}`" />
        </ul>
      </Transition>
    </div>
  </li>
</template>

<style scoped>
.catalogue-group {
  width: 100%;
}

.catalogue-group__header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 14px 18px;
  margin-top: 10px;
  border-radius: 14px;
  cursor: pointer;
  background: linear-gradient(180deg, color-mix(in srgb, var(--vp-c-bg-soft) 86%, white 14%), var(--vp-c-bg));
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, transparent);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.catalogue-group__header::before {
  content: "";
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 3px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-brand-1) 68%, transparent);
  opacity: 0.55;
}

.catalogue-group__header:hover {
  background: linear-gradient(180deg, color-mix(in srgb, var(--vp-c-brand-soft) 72%, white 28%), var(--vp-c-bg));
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 28%, transparent);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  transform: translateY(-1px);
}

.catalogue-group__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 10px;
  color: var(--vp-c-brand-1);
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-brand-soft) 70%, white 30%);
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.catalogue-group__arrow.is-expanded {
  transform: rotate(90deg);
}

.catalogue-group__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  flex: 1;
  line-height: 1.5;
}

.catalogue-group__count {
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: color-mix(in srgb, var(--vp-c-bg-soft) 72%, white 28%);
  padding: 4px 10px;
  border-radius: 999px;
  flex-shrink: 0;
}

.catalogue-group__children {
  list-style: none;
  margin: 10px 0 2px 11px;
  padding: 2px 0 2px 18px;
  border-left: 1px solid color-mix(in srgb, var(--vp-c-divider) 70%, transparent);
}

/* 叶子节点样式 */
:deep(.catalogue-item) a {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0;
  text-decoration: none;
  color: var(--vp-c-text-2);
  transition: color 0.15s ease, transform 0.15s ease;
}

:deep(.catalogue-item) a:hover {
  color: var(--vp-c-brand-1);
  transform: translateX(2px);
}

.catalogue-item__index {
  color: var(--vp-c-text-3);
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.catalogue-item__title {
  color: var(--vp-c-text-1);
  line-height: 1.7;
}

.catalogue-group.is-expanded > .catalogue-group__header::before {
  opacity: 1;
}

/* 折叠过渡动画 */
.catalogue-collapse-enter-active,
.catalogue-collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.catalogue-collapse-enter-from,
.catalogue-collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.catalogue-collapse-enter-to,
.catalogue-collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>

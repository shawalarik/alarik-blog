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
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  margin-top: 8px;
  border-radius: 8px;
  cursor: pointer;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.2s ease;
}

.catalogue-group__header:hover {
  background: var(--vp-c-bg-soft-hover);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.catalogue-group__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 11px;
  color: var(--vp-c-brand-1);
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
}

.catalogue-group__count {
  font-size: 12px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg);
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.catalogue-group__children {
  list-style: none;
  padding: 4px 0 4px 20px;
  margin: 0;
}

/* 叶子节点样式 */
:deep(.catalogue-item) a {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s ease;
}

:deep(.catalogue-item) a:hover {
  background: var(--vp-c-bg-soft-hover);
  transform: translateX(2px);
}

.catalogue-item__index {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

.catalogue-item__title {
  color: var(--vp-c-text-1);
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

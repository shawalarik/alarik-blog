<script setup lang="ts" name="DocAsideOutlineItem">
import type { MenuItem } from "./outline";
import { inject } from "vue";
import { useNamespace } from "@teek/composables";
import { articlePageOutlineKey } from "./outline";

defineOptions({ name: "DocAsideOutlineItem" });

defineProps<{ headers: MenuItem[]; root?: boolean }>();

const ns = useNamespace("aside-outline-item");
const customOutline = inject(articlePageOutlineKey, null);

function onClick(event: Event) {
  const el = event.target as HTMLAnchorElement;
  const id = el.href!.split("#")[1];

  if (customOutline) {
    event.preventDefault();
    customOutline.scrollToLink(`#${decodeURIComponent(id)}`);
    return;
  }

  const heading = document.getElementById(decodeURIComponent(id));
  heading?.focus({ preventScroll: true });
}
</script>

<template>
  <ul :class="[ns.b(), root ? ns.is('root') : ns.is('nested')]">
    <li v-for="{ children, link, title } in headers" :key="link">
      <a :class="ns.m('link')" :href="link" @click="onClick" :title="title">{{ title }}</a>
      <template v-if="children?.length">
        <DocAsideOutlineItem :headers="children" />
      </template>
    </li>
  </ul>
</template>

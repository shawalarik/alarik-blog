---
title: 关于 Alarik
date: 2025-08-06 23:53:30
sidebar: false
article: false
outline: false
articleBanner: false
---

<script setup lang="ts">
import { computed } from "vue";

// 与 .vitepress/config.ts 的 srcExclude 口径保持一致
const modules = import.meta.glob([
  "/**/*.md",
  "!/**/.vitepress/**",
  "!/**/node_modules/**",
  "!/01.指南/**",
  "!/10.配置/**",
  "!/15.主题开发/**",
  "!/20.资源/**",
  "!/30.生态/**",
]);

const RECOMMENDED_MD_LIMIT = 1200;

const activeMdCount = computed(() => Object.keys(modules).length);
const remainingMdCount = computed(() => RECOMMENDED_MD_LIMIT - activeMdCount.value);
const remainingText = computed(() => {
  if (remainingMdCount.value >= 0) return `${remainingMdCount.value}`;
  return `已超出 ${Math.abs(remainingMdCount.value)}`;
});
</script>

你好，我是 **Alarik**。

这里是我的私人 Blog 与知识平台，主要记录：

- 技术学习笔记与知识整理
- 真实项目中的问题排查与方案沉淀
- 架构设计、工程效率与质量保障相关实践
- 阶段性复盘与长期能力建设

## 站点容量监控

| 指标 | 当前值 |
| --- | --- |
| 参与启动/编译/打包流程的 MD 文件数 | {{ activeMdCount }} |
| 推荐上限（参与流程） | {{ RECOMMENDED_MD_LIMIT }} |
| 推荐剩余可新增 MD 文件数（剩余） | {{ remainingText }} |

## 关注方向

我关注的重点是把“会做”变成“可复用”：

- 将零散经验抽象为稳定方法
- 将一次性问题沉淀为检查清单
- 将个人实践转化为团队可协作的知识资产

## 联系方式

欢迎交流与协作：

- GitHub：<https://gitee.com/Alarikshaw>
- 主题项目：<https://github.com/Kele-Bingtang/vitepress-theme-teek>

## 致谢

感谢你来到这里阅读与交流。希望这些内容能帮助你更快解决问题，也欢迎你把实践反馈给我，一起把知识打磨得更实用。

<style scoped>
.vp-doc table:focus-visible {
  outline: none;
}

.vp-doc table {
  width: 100%;
}

img {
  display: inline-block;
}
</style>

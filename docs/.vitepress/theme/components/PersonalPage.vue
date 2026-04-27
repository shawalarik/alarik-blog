<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import { TkFooterInfo } from "@teek/components/theme/FooterInfo";

const { theme } = useData();

const heroBackground = computed(() => {
  const assetMeta = theme.value.assetMeta || {};
  const cdnBase = assetMeta.cdnBase || "";
  const heroCount = Number(assetMeta.heroCount) || 0;
  if (!cdnBase || heroCount <= 0) return "";

  const seed = "personal-page";
  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = (hash % heroCount) + 1;
  return `${cdnBase}/hero/hero${index}.jpg`;
});
</script>

<template>
  <div class="personal-page">
    <section class="personal-hero" :style="heroBackground ? { backgroundImage: `url(${heroBackground})` } : undefined">
      <div class="personal-hero__mask"></div>
      <div class="personal-hero__content">
        <h1>关于页面</h1>
      </div>
    </section>

    <section class="personal-section">
      <div class="personal-about">
        <h2>关于页面</h2>
        <div class="personal-about__content">
          <p>
            Hello，大家好，我是 Alarik，是一名 WEB 开发工程师，主要关注前端工程化、架构设计、性能优化与组件体系建设。
            日常会围绕 Vue、React、TypeScript、Node.js 与构建工具做持续实践，也会把真实项目中的问题排查和方案收口整理成文章。
          </p>
          <p>
            我比较喜欢在自己认定有价值的方向里长期深挖，把零散经验打磨成可复用的方法，把一次性问题沉淀为之后还能继续复用的工程知识。
            这个站点也是围绕这个目标搭建的，希望它不只是内容展示页，而是一个能持续积累与输出的个人知识空间。
          </p>
          <p>
            这里会记录我的学习笔记、项目复盘、前端基础、框架生态、构建链路、性能优化、代码质量与团队协作实践。
            如果这些内容刚好帮你少走一些弯路，那这个站点就已经有了意义。
          </p>
        </div>
      </div>
    </section>

    <TkFooterInfo class="personal-footer" />
  </div>
</template>

<style scoped>
.personal-page {
  padding-bottom: 12px;
  overflow-x: clip;
}

.personal-hero {
  position: relative;
  width: 100%;
  max-width: 100vw;
  min-height: 370px;
  margin-bottom: 40px;
  overflow: hidden;
  background: #b6b6b6 center center / cover no-repeat;
}

.personal-hero__mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.26);
}

.personal-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 370px;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
  color: #fff;
}

.personal-hero h1 {
  margin: 0;
  font-size: clamp(32px, 4vw, 40px);
  font-weight: 500;
  letter-spacing: 1px;
  text-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
}

.personal-section {
  width: min(1120px, calc(100vw - 48px));
  margin: 0 auto;
}

.personal-about {
  margin-top: -18px;
  padding: 24px 52px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.personal-about h2 {
  margin: 0 0 18px;
  font-size: 30px;
  font-weight: 500;
  text-align: center;
  color: var(--vp-c-text-1);
}

.personal-about__content {
  max-width: 880px;
  margin: 0 auto;
}

.personal-about__content p {
  margin: 0;
  color: var(--vp-c-text-2);
  line-height: 1.9;
  font-size: 16px;
  text-align: left;
}

.personal-about__content p + p {
  margin-top: 16px;
}

.personal-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  margin-top: 28px;
}

.personal-links a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 132px;
  height: 40px;
  padding: 0 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: #fff;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition:
    transform 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.personal-links a:hover {
  transform: translateY(-1px);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.1);
}

.personal-footer {
  width: min(1120px, calc(100vw - 48px));
  margin: 28px auto 0;
}

@media (max-width: 768px) {
  .personal-hero,
  .personal-hero__content {
    min-height: 370px;
  }

  .personal-section,
  .personal-footer {
    width: calc(100vw - 24px);
  }

  .personal-about {
    margin-top: -14px;
    padding: 28px 18px 24px;
    border-radius: 10px;
  }

  .personal-about h2 {
    font-size: 26px;
  }

  .personal-about__content p {
    font-size: 15px;
  }

  .personal-links {
    gap: 10px;
    margin-top: 22px;
  }

  .personal-links a {
    min-width: 118px;
    height: 38px;
    padding: 0 14px;
  }
}
</style>

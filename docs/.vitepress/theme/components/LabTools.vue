<script setup lang="ts">
import { computed, ref } from "vue";

const mdModules = (import.meta as any).glob([
  "../../../**/*.md",
  "!../../../.vitepress/**",
  "!../../../@fragment/**",
  "!../../../01.指南/**",
  "!../../../10.配置/**",
  "!../../../15.主题开发/**",
  "!../../../20.资源/**",
  "!../../../30.生态/**",
]) as Record<string, unknown>;
const mdRawModules = (import.meta as any).glob(
  [
    "../../../**/*.md",
    "!../../../.vitepress/**",
    "!../../../@fragment/**",
    "!../../../01.指南/**",
    "!../../../10.配置/**",
    "!../../../15.主题开发/**",
    "!../../../20.资源/**",
    "!../../../30.生态/**",
  ],
  {
  eager: true,
  query: "?raw",
  import: "default",
}
) as Record<string, string>;

const participatingMdCount = computed(() => Object.keys(mdModules).length);
const recommendedLimit = 1200;
const remainingCount = computed(() => Math.max(recommendedLimit - participatingMdCount.value, 0));
const capacityRatio = computed(() => Math.min(100, Math.round((participatingMdCount.value / recommendedLimit) * 100)));
const capacityLevel = computed(() => {
  if (capacityRatio.value >= 95) return { text: "超高负载", className: "is-danger" };
  if (capacityRatio.value >= 80) return { text: "接近上限", className: "is-warning" };
  return { text: "容量健康", className: "is-good" };
});

const mdRawTexts = computed(() => Object.values(mdRawModules).filter(Boolean));
const projectTextLength = computed(() => mdRawTexts.value.reduce((sum, text) => sum + text.length, 0));
const projectTextLineCount = computed(() =>
  mdRawTexts.value.reduce((sum, text) => sum + (text ? text.split(/\r?\n/).length : 0), 0)
);
const projectWordCount = computed(() => {
  const words = mdRawTexts.value.join("\n").match(/[A-Za-z0-9_]+/g);
  return words ? words.length : 0;
});

const randomMin = ref(1);
const randomMax = ref(100);
const randomResult = ref<number | null>(null);
const generateRandom = () => {
  const min = Math.min(randomMin.value, randomMax.value);
  const max = Math.max(randomMin.value, randomMax.value);
  randomResult.value = Math.floor(Math.random() * (max - min + 1)) + min;
};

const timestampInput = ref("");
const timestampResult = ref("");
const useCurrentTimestamp = () => {
  timestampInput.value = String(Date.now());
  convertTimestamp();
};
const convertTimestamp = () => {
  const raw = timestampInput.value.trim();
  if (!raw) {
    timestampResult.value = "";
    return;
  }
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    timestampResult.value = "请输入有效的时间戳数字。";
    return;
  }
  const ms = raw.length <= 10 ? num * 1000 : num;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    timestampResult.value = "时间戳无效。";
    return;
  }
  timestampResult.value = date.toLocaleString("zh-CN", { hour12: false });
};
</script>

<template>
  <div class="lab-hero">
    <h1>功能实验室</h1>
    <p>把零散想法做成可复用小工具，从这里开始持续迭代。</p>
  </div>

  <div class="tools-grid">
    <section class="tool-card">
      <div class="tool-head">
        <h2>站点容量监控</h2>
        <span class="status-badge" :class="capacityLevel.className">{{ capacityLevel.text }}</span>
      </div>
      <p class="tool-desc">自动统计参与启动/编译/打包流程的 MD 文件数，并给出容量占比。</p>

      <div class="progress-wrap">
        <div class="progress-label">
          <span>容量占比</span>
          <strong>{{ capacityRatio }}%</strong>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :class="capacityLevel.className" :style="{ width: `${capacityRatio}%` }"></div>
        </div>
      </div>

      <div class="metrics">
        <div class="metric-item">
          <span>参与流程 MD 文件数</span>
          <strong>{{ participatingMdCount }}</strong>
        </div>
        <div class="metric-item">
          <span>推荐上限</span>
          <strong>{{ recommendedLimit }}</strong>
        </div>
        <div class="metric-item">
          <span>推荐剩余可新增</span>
          <strong>{{ remainingCount }}</strong>
        </div>
      </div>
    </section>

    <section class="tool-card">
      <div class="tool-head">
        <h2>项目文字统计</h2>
      </div>
      <p class="tool-desc">统计当前项目参与编译/打包的 MD 总文字规模。</p>
      <div class="mini-metrics">
        <div class="mini-item">
          <span>总字符数</span>
          <strong>{{ projectTextLength }}</strong>
        </div>
        <div class="mini-item">
          <span>总行数</span>
          <strong>{{ projectTextLineCount }}</strong>
        </div>
        <div class="mini-item">
          <span>英文词数</span>
          <strong>{{ projectWordCount }}</strong>
        </div>
      </div>
    </section>

    <section class="tool-card">
      <div class="tool-head">
        <h2>随机数生成</h2>
      </div>
      <p class="tool-desc">给定区间，随机生成一个整数。</p>
      <div class="inline-fields">
        <input v-model.number="randomMin" class="tool-input" type="number" placeholder="最小值" />
        <input v-model.number="randomMax" class="tool-input" type="number" placeholder="最大值" />
      </div>
      <div class="actions">
        <button class="btn" @click="generateRandom">生成随机数</button>
      </div>
      <p class="result-text">结果：{{ randomResult ?? "-" }}</p>
    </section>

    <section class="tool-card">
      <div class="tool-head">
        <h2>时间戳转换</h2>
      </div>
      <p class="tool-desc">支持 10 位秒级或 13 位毫秒级时间戳。</p>
      <input v-model="timestampInput" class="tool-input" type="text" placeholder="输入时间戳" />
      <div class="actions">
        <button class="btn" @click="convertTimestamp">转换</button>
        <button class="btn ghost" @click="useCurrentTimestamp">当前时间</button>
      </div>
      <p class="result-text">时间：{{ timestampResult || "-" }}</p>
    </section>
  </div>
</template>

<style scoped>
.lab-hero {
  margin: 8px 0 20px;
  padding: 18px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: linear-gradient(120deg, color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent), transparent 55%);
}

.lab-hero h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

.lab-hero p {
  margin: 0;
  color: var(--vp-c-text-2);
}

.tool-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
}

.tool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tool-head h2 {
  margin: 0;
  font-size: 18px;
}

.tool-desc {
  margin: 8px 0 14px;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.is-good {
  color: #0f7a47;
  background: #e7f7ef;
}

.status-badge.is-warning {
  color: #8f5a00;
  background: #fff6df;
}

.status-badge.is-danger {
  color: #9b1c1c;
  background: #ffeaea;
}

.progress-wrap {
  margin-bottom: 14px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.progress-track {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.is-good {
  background: #22a06b;
}

.progress-fill.is-warning {
  background: #f0b429;
}

.progress-fill.is-danger {
  background: #e5484d;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.metric-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 10px;
  background: var(--vp-c-bg);
}

.metric-item span {
  display: block;
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin-bottom: 6px;
}

.metric-item strong {
  font-size: 20px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.tool-input {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  padding: 8px 10px;
  font-size: 13px;
}

.mini-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.mini-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px;
  background: var(--vp-c-bg);
}

.mini-item span {
  display: block;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.mini-item strong {
  font-size: 16px;
}

.inline-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.btn {
  border: 1px solid transparent;
  background: var(--vp-c-brand-1);
  color: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
}

.btn.ghost {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}

.result-text {
  margin: 10px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

@media (max-width: 960px) {
  .metrics {
    grid-template-columns: 1fr;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .mini-metrics {
    grid-template-columns: 1fr;
  }
}
</style>

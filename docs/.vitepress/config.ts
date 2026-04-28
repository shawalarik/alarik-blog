import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";
import { teekConfig } from "./teekConfig";
import { assetConfig } from "./assetConfig";
// 本地 Teek 主题包引用（与 Teek 在线主题包引用 二选一）
import { version } from "../../packages/teek/version";

// Teek 在线主题包引用（需安装 Teek 在线版本）
// import { version } from "vitepress-theme-teek/es/version";

const description = [
  "欢迎来到 Alarik 的私人 Blog 与知识平台",
  "这里记录技术实践、知识沉淀、项目复盘与个人思考",
  "以结构化目录与主题化索引管理内容，面向长期积累与高效检索",
].toString();
const isProdBuild = process.env.NODE_ENV === "production";
const enableLlmsTxt =
  process.env.VITEPRESS_ENABLE_LLMSTXT === "true" ||
  (!isProdBuild && process.env.VITEPRESS_ENABLE_LLMSTXT !== "false");
const enableLastUpdated =
  process.env.VITEPRESS_ENABLE_LAST_UPDATED === "true" ||
  (!isProdBuild && process.env.VITEPRESS_ENABLE_LAST_UPDATED !== "false");
const enableLocalSearch =
  process.env.VITEPRESS_ENABLE_LOCAL_SEARCH === "true" ||
  (!isProdBuild && process.env.VITEPRESS_ENABLE_LOCAL_SEARCH !== "false");

// https://vitepress.dev/reference/site-config
export default defineConfig({
  extends: teekConfig,
  title: "Alarik Blog",
  description: description,
  srcExclude: ["@fragment", "01.指南/**", "10.配置/**", "15.主题开发/**", "20.资源/**", "30.生态/**"],
  cleanUrls: false,
  lastUpdated: enableLastUpdated,
  lang: "zh-CN",
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/teek-logo-mini.svg" }],
    ["link", { rel: "icon", type: "image/png", href: "/teek-logo-mini.png" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:locale", content: "zh-CN" }],
    ["meta", { property: "og:title", content: "Alariks | Blog" }],
    ["meta", { property: "og:site_name", content: "Alariks Blog" }],
    ["meta", { property: "og:image", content: "https://vp.teek.top/teek-logo-large.png" }],
    ["meta", { property: "og:url", content: "https://alaris.com" }],
    ["meta", { property: "og:description", description }],
    ["meta", { name: "description", description }],
    ["meta", { name: "author", content: "Alarik" }],
    // 禁止浏览器缩放
    // [
    //   "meta",
    //   {
    //     name: "viewport",
    //     content: "width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no",
    //   },
    // ],
    ["meta", { name: "keywords", description }],
    ["meta", { name: "baidu-site-verification", content: "codeva-GdK2q9MO1i" }], // 百度收录
    // Bing 收录验证（msvalidate.01 会自动加载验证脚本，dev 环境会产生 404 报错）
    // ["meta", { name: "msvalidate.01", content: "48CABE70F538B8D117567176ABF325AF" }],
    ["script", { charset: "UTF-8", id: "LA_COLLECT", src: "//sdk.51.la/js-sdk-pro.min.js" }], // 51.la
    [
      "script",
      {},
      `typeof LA !== 'undefined' && LA.init({ id: "3LqfP8Icg0GeEvtn", ck: "3LqfP8Icg0GeEvtn", hashMode: true })`,
    ], // 51.la
  ],
  markdown: {
    // 开启行号
    lineNumbers: true,
    image: {
      // 默认禁用；设置为 true 可为所有图片启用懒加载。
      lazyLoading: true,
    },
    // 更改容器默认值标题
    container: {
      tipLabel: "提示",
      warningLabel: "警告",
      dangerLabel: "危险",
      infoLabel: "信息",
      detailsLabel: "详细信息",
    },
  },
  sitemap: {
    hostname: "https://alariks.com",
    transformItems: items => {
      const permalinkItemBak: typeof items = [];
      // 使用永久链接生成 sitemap
      const permalinks = (globalThis as any).VITEPRESS_CONFIG.site.themeConfig.permalinks;
      items.forEach(item => {
        const permalink = permalinks?.map[item.url.replace(".html", "")];
        if (permalink) permalinkItemBak.push({ url: permalink, lastmod: item.lastmod });
      });
      return [...items, ...permalinkItemBak];
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    assetMeta: {
      cdnBase: assetConfig.cdnBase,
      heroCount: assetConfig.heroCount,
      coverCount: assetConfig.coverCount,
    },
    logo: "/teek-logo-mini.svg",
    darkModeSwitchLabel: "主题",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "返回顶部",
    lastUpdatedText: "上次更新时间",
    outline: {
      level: [2, 4],
      label: "本页导航",
    },
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    nav: [
      { text: "首页", link: "/" },
      { 
        text: "JavaScript",
        items: [
          { text: "语言核心与异步编程", link: "/frontend/javascript/language-async" }, // 语言语法、类型系统、作用域、闭包、原型链、异步编程、事件循环、内存与性能、正则表达式、最新语言特性。这些都是 JS 语言本身的本质，与运行环境无关
          { text: "浏览器平台与 API", link: "/frontend/javascript/browser-api" }, // 所有浏览器提供的 API、DOM 操作、网络请求、存储、动画、图形、Web Components、浏览器安全与性能优化。这部分专注于“JS 在浏览器中的具体应用”
          { text: "工程化与 Node.js 基础", link: "/frontend/javascript/engineering-node" }, // 模块化、打包工具、包管理、代码质量、测试、调试，以及 JS 专家需要的 Node.js 基础（不深入后端框架，仅包括事件循环差异、模块系统、文件系统、简单 HTTP 服务）
        ]
      },
      { 
        text: "Vue",
        items: [
          { text: "响应式系统", link: "/frontend/vue/reactive" }, // 响应式原理 & MVVM
          { text: "Vue简史", link: "/frontend/vue/history" }, // Vue 发展历史&Vue2 vs Vue3 对比
          { text: "生态工具", link: "/frontend/vue/ecosystem" }, // Vue 生态系统工具（Router / Pinia / Vite）
        ]
      },
      { 
        text: "React",
        items: [
          { text: "核心概念", link: "/frontend/react/corecepts" }, // 核心概念 / JSX / Hooks / 生命周期）
          { text: "状态管理", link: "/frontend/react/state" }, // 状态管理 / Context API
          { text: "元框架", link: "/frontend/react/meta" }, // 元框架（React Router）
        ]
      },
      {
        text: "Node.js",
        items: [
          { text: "前端工程化应用", link: "/frontend/node/engineering" }, // 前端工程化应用（Webpack/Vite 插件、脚本）
          { text: "CLI 工具开发", link: "/frontend/node/cli" }, // CLI 工具开发（Node.js）
          { text: "npm 包管理与发布", link: "/frontend/node/npm" }, // npm 包管理与发布
          { text: "开发服务器与中间件", link: "/frontend/node/server" }, // 开发服务器与中间件（Express/Koa）
        ]
      },
      { 
        text: "TypeScript",
        items: [
          { text: "类型系统基础", link: "/frontend/typescript/basic" }, // 类型系统基础
          { text: "进阶用法", link: "/frontend/typescript/advance" }, // （泛型、装饰器、工具类型）
          { text: "框架的结合", link: "/frontend/typescript/framework" }, // 框架的结合（Vue/React）
        ]
      },
      {
        text: "清单",
        items: [
          { text: "清单页", link: "/articleOverview" },
          { text: "分类页", link: "/categories" },
          { text: "标签页", link: "/tags" }
        ]
      },
      { text: "图库", link: "/gallery" },
      {
        text: "索引",
        items: [
          { text: "归档页", link: "/archives" },
          // { text: "功能实验室", link: "/lab" },
          // { text: "登录页", link: "/login" },
          // { text: "风险链接提示页", link: "/risk-link?target=https://vp.teek.top" },
          // { text: "友链", link: "/resources/case" },
          { text: "🙋 关于我", link: "/personal" },
        ],
      },
      // { 
      //   text: "多端与扩展",
      //   items: [
      //     {
      //       text: "小程序",
      //       items: [
      //         { text: "原生小程序开发", link: "/multiplatform/miniprogram/native" },// （微信/抖音/支付宝 各自的 API、组件、生命周期）
      //         { text: "多端统一框架", link: "/multiplatform/miniprogram/uni-app" },// （uni-app / Taro 的跨端原理与适配）
      //         { text: "云开发与集成", link: "/multiplatform/miniprogram/cloud" },// 小程序云开发与后端集成（云函数、云数据库、云调用）
      //         { text: "性能优化及规范", link: "/multiplatform/miniprogram/performance" },// （包体积、启动速度、常见被拒原因）
      //       ]
      //     },
      //     { 
      //       text: "App",
      //       items: [
      //         { text: "React Native", link: "/multiplatform/app/react-native" },// React Native 开发跨端实践（核心组件、桥接原理、热更新）
      //         { text: "Vue 跨端框架", link: "/multiplatform/app/vue/vue-cross" },// （uni-app App 端 / Weex 的渲染机制与插件）
      //         { text: "原生 App", link: "/multiplatform/app/native" },// （Swift/Kotlin 快速入门、与前端交互）
      //         { text: "部署", link: "/multiplatform/app/deploy" },// （Android/iOS 证书、上架流程、常见问题）
      //       ]
      //     },
      //     { 
      //       text: "桌面端",
      //       items: [
      //         { text: "Electron 完全指南", link: "/multiplatform/desktop/electron" },// （主进程/渲染进程、IPC、打包与更新）
      //         { text: "Tauri 完全指南", link: "/multiplatform/desktop/tauri" },// （应用打包、配置文件、事件系统）
      //         { text: "本地存储与数据库", link: "/multiplatform/desktop/local-storage" },// （SQLite、IndexedDB、配置文件管理）
      //         { text: "自更新及日志收集", link: "/multiplatform/desktop/update" },// （自动更新、日志记录）
      //       ]
      //     },
      //     { 
      //       text: "扩展",
      //       items: [
      //         { text: "Chrome 扩展开发", link: "/multiplatform/extension/chrome" },// （API、事件、权限、存储、请求）
      //         { text: "跨浏览器扩展适配", link: "/multiplatform/extension/cross-browser" },// （Chrome、Firefox、Edge 等浏览器的扩展 适配）
      //         { text: "扩展与主机通信", link: "/multiplatform/extension/communication" },// （消息传递、事件触发通信）
      //         { text: "维护与调试", link: "/multiplatform/extension/maintenance" },// （隐私政策、审核规避、用户反馈）
      //       ]
      //     },
      //   ]
      // },
      // { 
      //   text: "后端开发",
      //   items: [
      //     { 
      //       text: "Java",
      //       items: [
      //         { text: "Java基础语法", link: "/backend/java/basic" },// （数据类型、控制流、类与对象、异常处理）
      //         { text: "Spring框架", link: "/backend/java/spring" },// （Spring Boot、MyBatis、MySQL 等）
      //         { text: "JVM与性能优化", link: "/backend/java/jvm" },// （垃圾回收、内存管理、线程池、数据库连接池）
      //       ]
      //     },
      //     { 
      //       text: "Python",
      //       items: [
      //         { text: "Python核心语法", link: "/backend/python/basic" },// （数据类型、控制流、函数、模块、异常处理）
      //         { text: "Django框架", link: "/backend/python/django" },// （Django 基础、模型、视图、URL、模板）
      //         { text: "Flask框架", link: "/backend/python/flask" },// （Flask 基础、路由、请求、响应、模板）
      //         { text: "异步协程编程", link: "/backend/python/async" },// （异步编程、协程、事件循环）
      //       ]
      //     },
      //     { 
      //       text: "Go",
      //       items: [
      //         { text: "Go基础语法", link: "/backend/go/basic" },// （数据类型、控制流、函数、模块、异常处理）
      //         { text: "Gin框架", link: "/backend/go/gin" },// （Gin 基础、路由、请求、响应、模板）
      //         { text: "标准库", link: "/backend/go/standard" },// （标准库、常用包）
      //       ]
      //     },
      //     {
      //       text: "Node",
      //       items: [
      //         { text: "Node.js 基础", link: "/backend/node/basic" },// （Node.js 基础、模块、事件循环）
      //         { text: "Express 框架", link: "/backend/node/express" },// Express 框架
      //         { text: "Koa 框架", link: "/backend/node/koa" },// Koa 框架
      //         { text: "Nest.js 框架", link: "/backend/node/nest" },// Nest.js 框架（企业级）
      //         { text: "工程化部署", link: "/backend/node/engineering" },// 工程化部署（容器化部署）
      //       ]
      //     }
      //   ]
      // },
      // { 
      //   text: "数据库",
      //   items: [
      //     { 
      //       text: "关系型数据库",
      //       items: [
      //         { text: "MySQL", link: "/database/relational/mysql" },// （MySQL 基础、安装、配置）
      //         { text: "Oracle", link: "/database/relational/oracle" },// （Oracle 基础、安装、配置）
      //         { text: "达梦", link: "/database/relational/dream" },// （达梦数据库）
      //       ]
      //     },
      //     { 
      //       text: "非关系型数据库",
      //       items: [
      //         { text: "MongoDB", link: "/database/norelational/mongodb" },// （MongoDB 基础、安装、配置）
      //         { text: "Redis", link: "/database/norelational/redis" },// （Redis 基础、安装、配置）
      //       ]
      //     },
      //   ]
      // },
      // {
      //   text: "AI 与集成",
      //   items: [
      //     { 
      //       text: "AI 工具",
      //       items: [
      //         { text: "提示词工程", link: "/ai/tools/prompt" },// （提示词工程、模型调用）
      //         { text: "常用 AI 工具", link: "/ai/tools/tools" },// （OpenAI、Google Cloud AI 等）
      //         { text: "辅助编码与调试", link: "/ai/tools/debug" },// （代码生成、调试、优化）
      //       ]
      //     },
      //     { 
      //       text: "前后端集成",
      //       items: [
      //         { text: "前端集成 AI", link: "/ai/integration/frontend" },// （前端集成 AI、后端集成 AI）/调用大模型 API / 流式响应与智能 UI 组件
      //         { text: "后端集成 AI", link: "/ai/integration/backend" },// （后端集成 AI）
      //       ]
      //     },
      //     { 
      //       text: "AI Agent",
      //       items: [
      //         { text: "理论基础", link: "/ai/agent/theory" },// （AI Agent、智能体）
      //         { text: "框架学习", link: "/ai/agent/frameworks" },// （AI Agent 框架学习）
      //         { text: "实战项目", link: "/ai/agent/project" },// （实战项目）
      //       ]
      //     },
      //   ]
      // },
      // { 
      //   text: "支付集成",
      //   items: [
      //     {
      //       text: "前端支付集成",
      //       items: [
      //         { text: "支付SDK接入", link: "/payment/frontend/sdk" },// （支付SDK接入）
      //         { text: "支付组件封装", link: "/payment/frontend/component" },// （支付组件封装）
      //         { text: "多端支付统一", link: "/payment/frontend/unified" },// （多端支付统一）
      //         { text: "Vue 项目支付", link: "/payment/frontend/vue" },// （支付宝/微信扫码、H5 调起）
      //         { text: "React 项目支付", link: "/payment/frontend/react" },// （支付宝/微信扫码、H5 调起）
      //         { text: "App 支付", link: "/payment/frontend/app" },// （iOS 内购，支付宝/微信 SDK）
      //         { text: "小程序支付", link: "/payment/frontend/miniprogram" },// （支付宝/微信小程序支付）
      //       ]
      //     },
      //     { 
      //       text: "后端支付处理",
      //       items: [
      //         { text: "支付接口开发", link: "/payment/backend/interface" },// （支付接口开发）
      //         { text: "回调通知处理", link: "/payment/backend/notify" },// （回调通知处理）
      //         { text: "对账与退款", link: "/payment/backend/refund" },// （对账与退款）
      //       ]
      //     },
      //     { 
      //       text: "支付安全与证书",
      //       items: [
      //         { text: "签名与验签", link: "/payment/security/sign" },// （签名与验签）
      //         { text: "证书管理与存储", link: "/payment/security/cert" },// （证书管理与存储）
      //         { text: "防重放攻击", link: "/payment/security/anti-replay" },// （防重放攻击）
      //       ]
      //     },
      //   ]
      // },
      // { 
      //   text: "算法",
      //   items: [
      //     { 
      //       text: "数据结构核心",
      //       items: [
      //         { text: "线性结构", link: "/algorithm/data-structure/linear" },// （数组、链表、栈、队列）
      //         { text: "哈希表与集合", link: "/algorithm/data-structure/hash" },// （哈希表、集合）
      //         { text: "树与二叉树", link: "/algorithm/data-structure/tree" },// （树、二叉树）
      //         { text: "图与并查集", link: "/algorithm/data-structure/graph" },// （图、并查集）
      //       ]
      //     },
      //     { 
      //       text: "算法思想范式",
      //       items: [
      //         { text: "递归与回溯", link: "/algorithm/paradigm/recursion" },// （递归与回溯）
      //         { text: "贪心与分治", link: "/algorithm/paradigm/greedy" },// （贪心与分治）
      //         { text: "双指针", link: "/algorithm/paradigm/two-pointer" },// （双指针）
      //         { text: "滑动窗口", link: "/algorithm/paradigm/sliding-window" },// （滑动窗口）
      //         { text: "哈希映射", link: "/algorithm/paradigm/hash-map" },// （哈希映射）
      //         { text: "动态规划", link: "/algorithm/paradigm/dp" },// （动态规划）
      //       ]
      //     },
      //     { 
      //       text: "力扣刷题实战",
      //       items: [
      //         { text: "数组与双指针", link: "/algorithm/leetcode/array-pointer" },// （数组与双指针）
      //         { text: "链表操作技巧", link: "/algorithm/leetcode/linked-list" },// （链表操作技巧）
      //         { text: "二叉树遍历系列", link: "/algorithm/leetcode/tree-traversal" },// （二叉树遍历系列）
      //         { text: "回溯剪枝实战", link: "/algorithm/leetcode/backtracking" },// （回溯剪枝实战）
      //       ]
      //     },
      //     { 
      //       text: "面试高频题解",
      //       items: [
      //         { text: "Top100 热题", link: "/algorithm/interview/top100" },// （Top100 热题）
      //         { text: "剑指 Offer 系列", link: "/algorithm/interview/offer" },// （剑指 Offer 系列）
      //         { text: "SQL 与 Shell", link: "/algorithm/interview/sql-shell" },// （SQL 与 Shell）
      //         { text: "多线程与设计题", link: "/algorithm/interview/design" },// （多线程与设计题）
      //       ]
      //     },
      //   ]
      // },
      // { 
      //   text: "前沿与面试",
      //   items: [
      //     { 
      //       text: "前沿技术",
      //       items: [
      //         { text: "最新语言特性", link: "/frontier/language" }, // （JS/TS 装饰器、模式匹配、Record & Tuple）
      //         { text: "新框架与范式", link: "/frontier/framework" }, // （Vue 3、React 18、Angular 16、Astro、Qwik、边缘计算、WebAssembly）
      //         { text: "服务端新趋势", link: "/frontier/server" }, // （Node.js 18、Koa 3、Fastify 4、Serverless、Bun、Deno）
      //         { text: "工具链前沿", link: "/frontier/toolchain" }, // （Vite、Rollup、Parcel 等）
      //       ]
      //     },
      //     { 
      //       text: "面试",
      //       items: [
      //         { text: "前端面试题", link: "/frontier/frontend" },
      //         { text: "后端面试题", link: "/frontier/backend" },
      //         { text: "算法与系统设计", link: "/frontier/algorithm-system" }, // （LeetCode高频、架构设计）
      //         { text: "行为面试与简历", link: "/frontier/behavior" }, // （HR面、项目经验、薪资谈判）
      //       ]
      //     },
      //   ]
      // },
      // {
      //   text: "站点信息",
      //   items: [
      //     {
      //       text: "博客配置",
      //       items: [
      //         { text: "当前博客配置", link: "/reference/config", activeMatch: "/10.配置/" },
      //         { text: "博客自定义开发", link: "/develop/intro", activeMatch: "/15.主题开发/" },
      //         { text: "Components 组件", link: "/ecosystem/components" },
      //         { text: "运行时 API", link: "/ecosystem/runtime-api" },
      //         { text: "Helper 工具", link: "/ecosystem/helper" },
      //         { text: "Composables 函数", link: "/ecosystem/composables" },
      //         { text: "Markdown 工具链", link: "/ecosystem/md-plugin-utils" }
      //       ]
      //     },
      //     {
      //       text: "日志信息",
      //       items: [
      //         { text: `主题版本：${version}`, link: "https://github.com/Kele-Bingtang/vitepress-theme-teek/releases" },
      //         { text: "主题更新日志", link: "https://github.com/Kele-Bingtang/vitepress-theme-teek/blob/dev/CHANGELOG.md" },
      //       ],
      //     },
      //   ],
      // }
    ],
    // socialLinks: [{ icon: "github", link: "https://github.com/Alarik" }],
    ...(enableLocalSearch
      ? {
          search: {
            provider: "local",
          } as any,
        }
      : {}),
  },
  vite: {
    plugins: [
      ...(enableLlmsTxt ? [llmstxt() as any] : []),
      // Permalink 路由重写中间件：在服务端将 .html 的 permalink 请求映射到实际文件路径
      // 这是最终兜底方案，确保无论 Teek 插件的 dev 中间件是否生效，都能正确路由
      {
        name: "permalink-rewrite-middleware",
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (!req.url) return next();

            let urlPath = decodeURI(req.url).split("?")[0].split("#")[0];
            const isHtml = urlPath.endsWith(".html");
            const isMd = urlPath.endsWith(".md");

            // 只处理 html/md 请求，跳过静态资源
            if (!isHtml && !isMd) return next();

            // 去掉扩展名得到访问路径
            const accessPath = isHtml ? urlPath.replace(/\.html$/, "") : urlPath.replace(/\.md$/, "");

            // 通过全局 permalinks.inv 数据查找实际文件路径
            // key 为 permalink（如 /frontend/vue/reactive.html），value 为文件路径（如 40.frontend/10.vue/10.reactive/index）
            const permalinks = (globalThis as any).VITEPRESS_CONFIG?.site?.themeConfig?.permalinks;
            if (!permalinks?.inv) return next();

            // 尝试多种 key 格式查找
            const filePath =
              permalinks.inv[accessPath] ||
              permalinks.inv[accessPath + ".html"] ||
              permalinks.inv[accessPath + "/"] ||
              permalinks.inv[accessPath.replace(/\/$/, "") + ".html"];

            if (filePath) {
              const searchPart = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
              const hashPart = req.url.includes("#") ? req.url.slice(req.url.indexOf("#")) : "";
              req.url = "/" + filePath + ".html" + searchPart + hashPart;
            }

            next();
          });
        },
      },
    ],
  },
  // transformHtml: (code, id, context) => {
  //   if (context.page !== "404.md") return code;
  //   return code.replace("404 | ", "");
  // },
});

// 本地 Teek 主题包引用（与 Teek 在线主题包引用 二选一）
import { defineTeekConfig } from "../../packages/config";
import { version } from "../../packages/teek/version";
import * as fs from "node:fs";
import * as path from "node:path";

// Teek 在线主题包引用（需安装 Teek 在线版本）
// import { defineTeekConfig } from "vitepress-theme-teek/config";
// import { version } from "vitepress-theme-teek/es/version";

/**
 * 从多层侧边栏数据中找到"包含叶子文章的分组节点"，提取为两级结构
 */
function extractTwoLevel(items: any[], docsDir: string): any[] {
  let current = items;

  // 沿单链向下，直到遇到"子项中有叶子文章（有link）的层"
  while (
    current.length === 1 &&
    current[0].items?.length &&
    !current[0].items.some((child: any) => child.link)
  ) {
    current = current[0].items;
  }

  return current.map(group => ({
    text: resolveGroupTitle(group, docsDir),
    collapsed: false,
    items: collectLeaves(group.items || []),
  }));
}

function buildModuleSidebars(items: any[], docsDir: string): Record<string, any[]> {
  const moduleSidebars = new Map<string, any[]>();

  const visit = (nodes: any[]) => {
    for (const node of nodes) {
      if (!node?.items?.length) continue;
      const leaves = collectLeaves(node.items);
      if (leaves.length) {
        const parentDirs = [...new Set(leaves.map(leaf => getLeafParentDir(leaf.link)).filter(Boolean))];
        if (parentDirs.length === 1) {
          const moduleKey = toSidebarKey(parentDirs[0]);
          if (!moduleSidebars.has(moduleKey)) {
            moduleSidebars.set(moduleKey, [
              {
                text: resolveModuleTitle(node, docsDir, parentDirs[0]),
                collapsed: false,
                items: leaves,
              },
            ]);
          }
        }
      }
      visit(node.items);
    }
  };

  visit(items);
  return Object.fromEntries(moduleSidebars);
}

/**
 * 解析分组标题：从 group 的子项 link 反推物理目录 → 读 index.md title
 * 此函数在 sidebarResolved 回调内调用，此时处于真实运行时环境，fs/path 可靠
 */
function resolveGroupTitle(group: any, docsDir: string): string {
  const rawText = group.text || "";

  // 从分组内递归找第一个叶子节点的 link
  const firstLink = findFirstLink(group);
  if (!firstLink) return rawText;

  // 从 link 反推目录路径
  // link 格式示例: /40.frontend/10.vue/10.reactive/01.xxx 或 /frontend/vue/reactive/paradigm-basics.html
  const cleanPath = firstLink.replace(/\.html$/, "").split("/").filter(Boolean);

  // 找编号目录层级的位置
  for (let i = cleanPath.length - 1; i >= 0; i--) {
    if (/^\d+\..+/.test(cleanPath[i])) {
      // 构建到该目录的物理路径并读 index.md
      const dirParts = cleanPath.slice(0, i + 1);
      const dirPath = path.join(docsDir, ...dirParts);
      const title = readIndexTitle(dirPath);
      if (title && title !== rawText) return title;
    }
  }

  return rawText;
}

function resolveModuleTitle(group: any, docsDir: string, moduleDir: string): string {
  const rawText = group.text || "";
  const dirPath = path.join(docsDir, ...moduleDir.replace(/^\/+/, "").split("/").filter(Boolean));
  return readIndexTitle(dirPath) || rawText;
}

/** 递归查找第一个有 link 的叶子节点 */
function findFirstLink(node: any): string | null {
  if (node.link) return node.link;
  if (node.items?.length) {
    for (const item of node.items) {
      const found = findFirstLink(item);
      if (found) return found;
    }
  }
  return null;
}

/** 读取目录下 index.md 的 frontmatter.title */
function readIndexTitle(dirPath: string): string | null {
  try {
    const dirName = path.basename(dirPath);
    const candidates = ["index.md", "index.MD", `${dirName}.md`, `${dirName}.MD`];
    for (const fileName of candidates) {
      const filePath = path.join(dirPath, fileName);
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, "utf-8");
      const frontmatterMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)^[ \t]*---\s*$/m);
      if (frontmatterMatch) {
        const titleMatch = frontmatterMatch[1].match(/^[ \t]*title:[ \t]*(.+?)\s*$/m);
        if (titleMatch?.[1]) return titleMatch[1].replace(/^['"]|['"]$/g, "").trim();
      }
      const h1Match = content.match(/^#\s+(.+)$/m);
      if (h1Match?.[1]) return h1Match[1].trim();
    }
    return null;
  } catch {
    return null;
  }
}

function getLeafParentDir(link: string): string {
  const clean = link.replace(/\.html$/, "").replace(/[?#].*$/, "");
  const parts = clean.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return `/${parts.slice(0, -1).join("/")}`;
}

function toSidebarKey(dir: string): string {
  return `/${dir.replace(/^\/+|\/+$/g, "")}/`;
}

/** 递归收集所有叶子文章（有 link 且无 items 的节点） */
function collectLeaves(items: any[]): { text: string; link: string }[] {
  const leaves: { text: string; link: string }[] = [];
  for (const item of items) {
    if (item.items?.length) {
      leaves.push(...collectLeaves(item.items));
    } else if (item.link) {
      leaves.push({ text: item.text, link: item.link });
    }
  }
  return leaves;
}

export const teekConfig = defineTeekConfig({
  sidebarTrigger: true,
  author: { name: "Alarik", link: "https://alariks.com" },
  blogger: {
    name: "Alarik",
    slogan: "持续学习，持续构建，把零散知识沉淀成可复用的方法论",
    avatar: "https://testingcf.jsdelivr.net/gh/Kele-Bingtang/static/user/avatar1.png",
    shape: "circle-rotate",
    circleBgImg: "/blog/bg4.webp",
    color: "#ffffff",
    circleSize: 120,
    status: {
      icon: "🧠",
      size: 28,
      title: "学习中",
    },
  },
  footerInfo: {
    theme: {
      name: `Powered by Teek@${version}`,
    },
    copyright: {
      createYear: 2026,
      suffix: "Alarik",
    },
  },
  codeBlock: {
    copiedDone: TkMessage => TkMessage.success("复制成功！"),
  },
  post: {
    showCapture: true,
  },
  articleBanner: {
    enabled: true,
  },
  articleShare: { enabled: true },
  comment: {
    provider: "giscus",
    options: {
      repo: "shawalarik/alarik-blog-comments",
      repoId: "R_kgDOR_pyDA",
      category: "Announcements",
      categoryId: "DIC_kwDOR_pyDM4C6lyu",
      mapping: "pathname",
      strict: "0",
      reactionsEnabled: "1",
      emitMetadata: "0",
      inputPosition: "bottom",
      lang: "zh-CN",
      theme: "preferred_color_scheme",
      loading: "lazy",
    },
  },
  vitePlugins: {
    sidebarOption: {
      initItems: false,
      ignoreIndexMd: true,
      /**
       * 将 Teek 自动生成的多层侧边栏压缩为两级：
       *   一级 = 包含文章的子目录（使用 index.md 的 title 作为标题）
       *   二级 = 文章列表
       *
       * 文件系统操作全部在此回调内部执行（真实运行时，不受 jiti 影响）
       */
      sidebarResolved(data) {
        if (typeof data === "object" && !Array.isArray(data)) {
          const docsDir = path.resolve(__dirname, "..");
          const nextData: Record<string, any> = { ...(data as Record<string, any>) };
          for (const key of Object.keys(data)) {
            const entries = (data as any)[key];
            if (Array.isArray(entries)) {
              const moduleSidebars = buildModuleSidebars(entries, docsDir);
              Object.assign(nextData, moduleSidebars);
              nextData[key] = extractTwoLevel(entries, docsDir);
            }
          }
          return nextData;
        }
        return data;
      },
    },
  },
  markdown: {
    demo: {
      githubUrl: "https://github.com/Alarik",
    },
  },
  // siteAnalytics: [
  //   {
  //     provider: "baidu",
  //     options: {
  //       id: "d5ee872d9aa1ef8021f4a3921b2e9c2a",
  //     },
  //   },
  //   {
  //     provider: "google",
  //     options: {
  //       id: "G-K5GNDW3L7K",
  //     },
  //   },
  // ],
});

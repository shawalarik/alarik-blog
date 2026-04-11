import type { TeekConfig } from "@teek/config";
import { assetConfig } from "../../assetConfig";

const CDN_BASE = assetConfig.cdnBase;
const BANNER_4K_COUNT = assetConfig.banner4kCount;
const BANNER_4K_IMAGES = Array.from({ length: BANNER_4K_COUNT }, (_, i) => `${CDN_BASE}/banner/4k/banner${i + 1}.jpg`);
const BANNER_IMG_INTERVAL = assetConfig.bannerImgInterval;
const BANNER_IMG_SHUFFLE = assetConfig.bannerImgShuffle;

// 文档配置
export const teekDocConfig: TeekConfig = {
  themeEnhance: {
    layoutSwitch: {
      defaultMode: "bothWidthAdjustable",
    },
  },
};

// 博客基础配置
const teekBlogCommonConfig: TeekConfig = {
  teekHome: true,
  vpHome: false,
  loading: true,
  wallpaper: {
    enabled: true,
    hideBanner: true,
  },
  footerInfo: {
    customHtml: `<span id="runtime"></span>`, // 需要搭配 .vitepress/theme/helper/useRuntime.ts 使用
    bottomMessage: [`主体备案：黔ICP备19002017号`],
    icpRecord: {
      name: "黔ICP备19002017号-8",
      link: "https://beian.miit.gov.cn",
    },
  },
  docAnalysis: {
    createTime: "2026-1-19",
    statistics: {
      provider: "vercount",
      siteView: true,
      pageView: true,
      permalink: true,
      tryRequest: true,
      tryCount: 5,
      tryIterationTime: 2000,
    },
  },
  friendLink: {
    list: [
      {
        name: "Teeker",
        desc: "朝圣的使徒，正在走向编程的至高殿堂！",
        avatar: "https://testingcf.jsdelivr.net/gh/Kele-Bingtang/static/user/avatar2.png",
        link: "http://notes.teek.top/",
      },
      {
        name: "vuepress-theme-vdoing",
        desc: "🚀一款简洁高效的VuePress 知识管理&博客 主题",
        avatar: "https://doc.xugaoyi.com/img/logo.png",
        link: "https://doc.xugaoyi.com/",
      },
      {
        name: "One",
        desc: "明心静性，爱自己",
        avatar: "https://onedayxyy.cn/img/xyy.webp",
        link: "https://onedayxyy.cn/",
      },
      {
        name: "Hyde Blog",
        desc: "人心中的成见是一座大山",
        avatar: "https://teek.seasir.top/avatar/avatar.webp",
        link: "https://teek.seasir.top/",
      },
      {
        name: "二丫讲梵",
        desc: "💻学习📝记录🔗分享",
        avatar: "https://wiki.eryajf.net/img/logo.png",
        link: " https://wiki.eryajf.net/",
      },
      {
        name: "粥里有勺糖",
        desc: "简约风的 VitePress 博客主题",
        avatar: "https://theme.sugarat.top/logo.png",
        link: "https://theme.sugarat.top/",
      },
      {
        name: "VitePress 快速上手中文教程",
        desc: "如果你也想搭建它，那跟我一起做吧",
        avatar: "https://avatars.githubusercontent.com/u/90893790?v=4",
        link: "https://vitepress.yiov.top/",
      },
      {
        name: "友人A",
        desc: "おとといは兎をみたの，昨日は鹿，今日はあなた",
        avatar: "http://niubin.site/logo.jpg",
        link: "http://niubin.site/",
      },
    ],
    autoScroll: true,
  },
  social: [
    {
      icon: "icon-github",
      name: "GitHub",
      link: "https://github.com/shawalarik",
    },
    {
      icon: "icon-gitee",
      name: "Gitee",
      link: "https://gitee.com/Alarikshaw",
    },
  ],
};

// 博客默认配置
export const teekBlogConfig: TeekConfig = {
  ...teekBlogCommonConfig,
  banner: {
    name: "🎉 Alarik Blog",
    description: "大雨落幽燕，白浪滔天 —— 毛泽东《浪淘沙·北戴河》",
    bgStyle: "partImg",
  },
};

// 博客小图配置
export const teekBlogParkConfig: TeekConfig = {
  ...teekBlogCommonConfig,
  banner: {
    name: "🎉 Alarik Blog",
    bgStyle: "partImg",
    imgSrc: BANNER_4K_IMAGES,
    imgInterval: BANNER_IMG_INTERVAL,
    imgShuffle: BANNER_IMG_SHUFFLE,
    description: [
      "大雨落幽燕，白浪滔天 —— 毛泽东《浪淘沙·北戴河》",
      "莫道桑榆晚，为霞尚满天 —— 刘禹锡《酬乐天咏老见示》",
      "长风破浪会有时，直挂云帆济沧海 —— 李白《行路难》",
      "路漫漫其修远兮，吾将上下而求索 —— 屈原《离骚》",
      "会当凌绝顶，一览众山小 —— 杜甫《望岳》",
      "劝君莫惜金缕衣，劝君惜取少年时 —— 杜秋娘《金缕衣》",
      "大鹏一日同风起，扶摇直上九万里 —— 李白《上李邕》",
      "千淘万漉虽辛苦，吹尽狂沙始到金 —— 刘禹锡《浪淘沙》",
    ],
    descStyle: "switch",
  },
  footerGroup: [
    {
      title: "外部链接",
      links: [
        { name: "示例 1", link: "https://vp.teek.top" },
        { name: "示例 2", link: "https://vp.teek.top" },
        { name: "示例 3", link: "https://vp.teek.top" },
      ],
    },
    {
      title: "内部链接",
      links: [
        { name: "快速开始", link: "/guide/quickstart" },
        { name: "配置简介", link: "/reference/config" },
      ],
    },
  ],
};

// 博客大图配置
export const teekBlogFullConfig: TeekConfig = {
  ...teekBlogCommonConfig,
  post: {
    coverImgMode: "full",
  },
  banner: {
    name: "🎉 Alarik Blog",
    bgStyle: "fullImg",
    imgSrc: BANNER_4K_IMAGES,
    imgInterval: BANNER_IMG_INTERVAL,
    imgShuffle: BANNER_IMG_SHUFFLE,
    description: [
      "大雨落幽燕，白浪滔天 —— 毛泽东《浪淘沙·北戴河》",
      "莫道桑榆晚，为霞尚满天 —— 刘禹锡《酬乐天咏老见示》",
      "长风破浪会有时，直挂云帆济沧海 —— 李白《行路难》",
      "路漫漫其修远兮，吾将上下而求索 —— 屈原《离骚》",
      "会当凌绝顶，一览众山小 —— 杜甫《望岳》",
      "劝君莫惜金缕衣，劝君惜取少年时 —— 杜秋娘《金缕衣》",
      "大鹏一日同风起，扶摇直上九万里 —— 李白《上李邕》",
      "千淘万漉虽辛苦，吹尽狂沙始到金 —— 刘禹锡《浪淘沙》",
    ],
    descStyle: "types",
  },
  comment: { provider: "" },
  codeBlock: {
    overlay: true,
  },
  themeEnhance: {
    themeColor: {
      append: [
        {
          label: "博客扩展主题",
          tip: "博客扩展主题",
          options: [
            { label: "紫罗兰", value: "violet", color: "#7166f0" },
            { label: "珊瑚粉", value: "coral-pink", color: "#ff6b6b" },
            { label: "天蓝", value: "sky-blue", color: "#00bbf9" },
            { label: "蓝绿", value: "blue-green", color: "#00f5d4" },
            { label: "石板灰", value: "slate-gray", color: "#708090" },
            { label: "粉红", value: "pink", color: "#f15bb5" },
            { label: "黄绿", value: "yellow-green", color: "#8ac926" },
            { label: "橙红", value: "orange-red", color: "#ff9e6b" },
          ],
        },
      ],
    },
  },
};

// 博客全图配置
export const teekBlogBodyConfig: TeekConfig = {
  ...teekBlogCommonConfig,
  pageStyle: "segment-nav",
  bodyBgImg: {
    imgSrc: BANNER_4K_IMAGES,
    imgInterval: BANNER_IMG_INTERVAL,
    imgShuffle: BANNER_IMG_SHUFFLE,
  },
  banner: {
    name: "🎉 Alarik Blog",
    description: [
      "大雨落幽燕，白浪滔天 —— 毛泽东《浪淘沙·北戴河》",
      "莫道桑榆晚，为霞尚满天 —— 刘禹锡《酬乐天咏老见示》",
      "长风破浪会有时，直挂云帆济沧海 —— 李白《行路难》",
      "路漫漫其修远兮，吾将上下而求索 —— 屈原《离骚》",
      "会当凌绝顶，一览众山小 —— 杜甫《望岳》",
      "劝君莫惜金缕衣，劝君惜取少年时 —— 杜秋娘《金缕衣》",
      "大鹏一日同风起，扶摇直上九万里 —— 李白《上李邕》",
      "千淘万漉虽辛苦，吹尽狂沙始到金 —— 刘禹锡《浪淘沙》",
    ],
    descStyle: "types",
  },
  themeEnhance: {
    layoutSwitch: {
      defaultMode: "original",
    },
  },
};

// 博客卡片配置
export const teekBlogCardConfig: TeekConfig = {
  ...teekBlogCommonConfig,
  post: {
    postStyle: "card",
  },
  homeCardListPosition: "left",
  banner: {
    name: "🎉 Alarik Blog",
    bgStyle: "fullImg",
    imgSrc: BANNER_4K_IMAGES,
    imgInterval: BANNER_IMG_INTERVAL,
    imgShuffle: BANNER_IMG_SHUFFLE,
    description: [
      "大雨落幽燕，白浪滔天 —— 毛泽东《浪淘沙·北戴河》",
      "莫道桑榆晚，为霞尚满天 —— 刘禹锡《酬乐天咏老见示》",
      "长风破浪会有时，直挂云帆济沧海 —— 李白《行路难》",
      "路漫漫其修远兮，吾将上下而求索 —— 屈原《离骚》",
      "会当凌绝顶，一览众山小 —— 杜甫《望岳》",
      "劝君莫惜金缕衣，劝君惜取少年时 —— 杜秋娘《金缕衣》",
      "大鹏一日同风起，扶摇直上九万里 —— 李白《上李邕》",
      "千淘万漉虽辛苦，吹尽狂沙始到金 —— 刘禹锡《浪淘沙》",
    ],
    descStyle: "types",
  },
};

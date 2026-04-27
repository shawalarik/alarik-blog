export type AssetConfig = {
  cdnBase: string; // 资源CDN基础URL
  assetRepoTreeApi: string; // 图床仓库树 API
  banner4kCount: number; // 轮播图数量
  coverCount: number; // 文章封面数量
  bannerImgInterval: number; // 轮播图切换间隔时间（毫秒）
  bannerImgShuffle: boolean; // 是否随机切换轮播图
  deprecatedDirs: string[]; // 已废弃的目录列表
  galleryCategories: AssetGalleryCategoryConfig[]; // 相册页分类配置
};

export type AssetGalleryCategoryConfig = {
  key: string; // 分类唯一标识
  label: string; // 分类名称
  dir: string; // 图床目录
  source: "sequence" | "tree"; // 生成方式：固定编号或仓库树扫描
  prefix?: string; // 固定编号前缀
  extension?: string; // 文件扩展名
  count?: number; // 固定编号总数
  description?: string; // 分类说明
};

const banner4kCount = 27;
const coverCount = 80;

export const assetConfig: AssetConfig = {
  cdnBase: "https://cdn.jsdelivr.net/gh/shawalarik/alarik-assets@master",
  assetRepoTreeApi: "https://api.github.com/repos/shawalarik/alarik-assets/git/trees/master?recursive=1",
  banner4kCount,
  coverCount,
  bannerImgInterval: 15000,
  bannerImgShuffle: true,
  deprecatedDirs: ["@fragment", "01.指南", "10.配置", "15.主题开发", "20.资源", "30.生态"],
  galleryCategories: [
    {
      key: "banner",
      label: "4K",
      dir: "banner/4k",
      source: "sequence",
      prefix: "banner",
      extension: "jpg",
      count: banner4kCount,
      description: "首页大图与轮播素材",
    },
    {
      key: "post",
      label: "插图",
      dir: "post",
      source: "tree",
      description: "文章插图与主题配图",
    },
    {
      key: "cover",
      label: "封面",
      dir: "cover",
      source: "sequence",
      prefix: "cover",
      extension: "jpg",
      count: coverCount,
      description: "文章封面素材",
    },
    {
      key: "gallery",
      label: "个人喜好",
      dir: "gallery",
      source: "tree",
      description: "个人收藏与偏好图库",
    },
  ],
};

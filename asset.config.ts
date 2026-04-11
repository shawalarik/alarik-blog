export type AssetConfig = {
  cdnBase: string;
  banner4kCount: number;
  coverCount: number;
  bannerImgInterval: number;
  bannerImgShuffle: boolean;
  deprecatedDirs: string[];
};

export const assetConfig: AssetConfig = {
  cdnBase: "https://cdn.jsdelivr.net/gh/shawalarik/alarik-assets@master",
  banner4kCount: 27,
  coverCount: 80,
  bannerImgInterval: 6000,
  bannerImgShuffle: true,
  deprecatedDirs: ["01.指南", "10.配置", "15.主题开发", "20.资源", "30.生态"],
};

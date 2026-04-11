# 图床与图片命名规则

## 统一变量入口

- 根目录配置文件：`asset.config.ts`
- 后续只改这个文件里的变量，不需要去多个配置文件改数字
- 当前可调变量：
  - `cdnBase`
  - `banner4kCount`
  - `coverCount`
  - `bannerImgInterval`
  - `bannerImgShuffle`
  - `deprecatedDirs`

## 当前图床

- 仓库：`shawalarik/alarik-assets`
- CDN 前缀：读取 `asset.config.ts` 的 `cdnBase`

## 目录约定

- `avatar/`：头像
- `banner/4k/`：博客大图 Banner
- `cover/`：文章封面
- `post/`：文章插图
- `friend-link/`：友链头像
- `gallery/`：个人图库
- `logo/`：站点 logo
- `social/`：社交卡片图
- `misc/`：其他素材
- `temp/`：临时素材
- `archive/`：归档素材

## Banner 自动读取规则

- 当前项目使用固定规则读取 `banner/4k/`：
  - 文件名：`banner1.jpg`、`banner2.jpg`、...、`bannerN.jpg`
  - 项目配置文件：`docs/.vitepress/theme/config/teekConfig.ts`
  - 数量变量：`asset.config.ts` 的 `banner4kCount`
- 当前 `banner4kCount = 16`，会读取 `banner1.jpg` 到 `banner16.jpg`。

## 下次新增图片的最短流程

1. 往图床仓库 `banner/4k/` 上传新图，命名为下一个序号（例如 `banner17.jpg`）。
2. 在当前项目根目录 `asset.config.ts` 把 `banner4kCount` 从 `16` 改为 `17`。
3. 运行 `pnpm docs:build` 验证。
4. 提交并部署。

## Cover 自动读取规则

- 当前项目使用固定规则读取 `cover/`：
  - 文件名：`cover1.jpg`、`cover2.jpg`、...、`coverN.jpg`
  - 项目配置文件：`docs/.vitepress/teekConfig.ts`
  - 数量变量：`asset.config.ts` 的 `coverCount`
- 当前 `coverCount = 60`，会读取 `cover1.jpg` 到 `cover60.jpg`。

## 列表封面排除目录

- 文章列表封面图不会渲染以下目录文章：
  - `01.指南/`
  - `10.配置/`
  - `15.主题开发/`
  - `20.资源/`
  - `30.生态/`

## 链接规则

- 单张图片 CDN 链接格式：  
  `https://cdn.jsdelivr.net/gh/shawalarik/alarik-assets@master/<目录>/<文件名>`
- 示例：  
  `https://cdn.jsdelivr.net/gh/shawalarik/alarik-assets@master/banner/4k/banner1.jpg`

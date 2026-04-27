import { assetConfig, type AssetGalleryCategoryConfig } from "../../../../asset.config";

const IMAGE_EXT_RE = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const SESSION_CACHE_KEY = "alarik-gallery-tree-cache";
const SESSION_CACHE_TTL = 1000 * 60 * 30;

export type GalleryAssetItem = {
  id: string;
  title: string;
  url: string;
  path: string;
  filename: string;
  categoryKey: string;
  categoryLabel: string;
  categoryDir: string;
  description?: string;
  aspectRatio: number;
};

export type GalleryAssetCategory = AssetGalleryCategoryConfig & {
  count: number;
};

type RepoTreeResponse = {
  tree?: Array<{
    path: string;
    type: string;
  }>;
};

let galleryAssetsPromise: Promise<{
  items: GalleryAssetItem[];
  categories: GalleryAssetCategory[];
}> | null = null;

export async function loadGalleryAssets() {
  if (!galleryAssetsPromise) {
    galleryAssetsPromise = createGalleryAssets();
  }

  return galleryAssetsPromise;
}

async function createGalleryAssets() {
  const repoTreePaths = await getRepoTreePaths();

  const categories = assetConfig.galleryCategories.map(category => {
    const items = buildCategoryItems(category, repoTreePaths);
    return {
      category: {
        ...category,
        count: items.length,
      },
      items,
    };
  });

  return {
    items: categories.flatMap(({ items }) => items),
    categories: categories.map(({ category }) => category),
  };
}

function buildCategoryItems(category: AssetGalleryCategoryConfig, repoTreePaths: string[]): GalleryAssetItem[] {
  if (category.source === "sequence") {
    return buildSequenceItems(category);
  }

  return buildTreeItems(category, repoTreePaths);
}

function buildSequenceItems(category: AssetGalleryCategoryConfig): GalleryAssetItem[] {
  const count = category.count ?? 0;
  const extension = category.extension ?? "jpg";
  const prefix = category.prefix ?? category.key;

  return Array.from({ length: count }, (_, index) => {
    const fileName = `${prefix}${index + 1}.${extension}`;
    const path = `${category.dir}/${fileName}`;

    return {
      id: `${category.key}-${index + 1}`,
      title: `${category.label} ${index + 1}`,
      url: joinCdnUrl(path),
      path,
      filename: fileName,
      categoryKey: category.key,
      categoryLabel: category.label,
      categoryDir: category.dir,
      description: category.description,
      aspectRatio: getDefaultAspectRatio(category.key),
    };
  });
}

function buildTreeItems(category: AssetGalleryCategoryConfig, repoTreePaths: string[]): GalleryAssetItem[] {
  return repoTreePaths
    .filter(path => path.startsWith(`${category.dir}/`) && IMAGE_EXT_RE.test(path))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(path => {
      const fileName = path.split("/").pop() || path;

      return {
        id: `${category.key}-${path}`,
        title: formatAssetTitle(fileName),
        url: joinCdnUrl(path),
        path,
        filename: fileName,
        categoryKey: category.key,
        categoryLabel: category.label,
        categoryDir: category.dir,
        description: category.description,
        aspectRatio: getDefaultAspectRatio(category.key),
      };
    });
}

async function getRepoTreePaths() {
  if (typeof window === "undefined") return [];

  const cached = readRepoTreeCache();
  if (cached) return cached;

  const response = await fetch(assetConfig.assetRepoTreeApi, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`图床目录读取失败：${response.status}`);
  }

  const payload = (await response.json()) as RepoTreeResponse;
  const paths = (payload.tree || [])
    .filter(item => item.type === "blob")
    .map(item => item.path)
    .filter(Boolean);

  writeRepoTreeCache(paths);
  return paths;
}

function readRepoTreeCache() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as { expiresAt?: number; paths?: string[] };
    if (!cache.expiresAt || cache.expiresAt < Date.now() || !Array.isArray(cache.paths)) {
      window.sessionStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }

    return cache.paths;
  } catch {
    return null;
  }
}

function writeRepoTreeCache(paths: string[]) {
  try {
    window.sessionStorage.setItem(
      SESSION_CACHE_KEY,
      JSON.stringify({
        expiresAt: Date.now() + SESSION_CACHE_TTL,
        paths,
      })
    );
  } catch {
    // 忽略缓存异常，不影响页面展示
  }
}

function joinCdnUrl(path: string) {
  return `${assetConfig.cdnBase}/${path}`.replace(/([^:]\/)\/+/g, "$1");
}

function formatAssetTitle(fileName: string) {
  return fileName
    .replace(IMAGE_EXT_RE, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function getDefaultAspectRatio(categoryKey: string) {
  if (categoryKey === "banner") return 16 / 9;
  if (categoryKey === "cover") return 4 / 5;
  if (categoryKey === "post") return 4 / 5;
  return 3 / 4;
}

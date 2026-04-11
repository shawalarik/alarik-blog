import { useRouter, useData } from "vitepress";
import { onBeforeMount } from "vue";

/**
 * 监听永久链接跳转
 *
 * @param executeBeforeMountFn 是否执行 beforeMount 阶段，当只要获取 teyGetFilePathByPermalink 函数时，可以设置为 false，避免重复执行 beforeMount 阶段
 */
export default function usePermalink(executeBeforeMountFn = true) {
  const fakeHost = "http://a.com";
  const router = useRouter();
  const { site, theme, localeIndex } = useData();
  const { base, cleanUrls } = site.value;
  const { permalinks = {} } = theme.value;
  const permalinkKeys = Object.keys(permalinks);

  /**
   * 判断路由是否为文档路由，
   * 1、如果为文档路由，则替换为 permalink
   * 2、如果为 permalink，则跳转到文档路由，然后重新触发该方法的第 1 点，即将文档路由替换为 permalink（先加载 404 页面再瞬间跳转文档路由）
   *
   * @param href 访问的文档地址或 permalink
   */
  const replaceUrlWhenPermalinkExist = async (href: string) => {
    if (!permalinkKeys.length) return;

    const { pathname, search, hash } = new URL(href, fakeHost);
    // 解码，支持中文
    const decodePath = decodeURIComponent(pathname.slice(base.length).replace(/\/$/, ""));
    // 防御性查找：尝试多种可能的 key 格式（兼容 index.md 的尾部 / 问题）
    const lookupKey = decodePath.replace(/\.html/, "");
    const permalink =
      permalinks.map[lookupKey] || permalinks.map[lookupKey + "/"] || permalinks.map[lookupKey.replace(/\/$/, "")];

    // 如果当前 pathname 和 permalink 相同，则不需要处理
    if (permalink === "/" + decodePath) return;

    if (permalink) {
      // 存在 permalink 则立即同步替换 URL（不包裹 nextTick，避免首次渲染后闪烁）
      const to = base.replace(/\/$/, "") + permalink + search + hash;
      history.replaceState(history.state || null, "", to);
      return router.onAfterUrlLoad?.(to);
    }

    // 不存在 permalink 且 当前 URL 不是已知的 permalink 时才尝试反向查找并跳转
    // 这避免了通过 rewrites 或 dev 中间件正确映射到美化路由后又被反向重定向的问题
    const maybeIsPermalink = (cleanUrls ? decodePath : `${decodePath}.html`) in (permalinks.inv || {});
    if (!maybeIsPermalink) {
      const filePath = teyGetFilePathByPermalink(pathname);
      if (filePath) {
        const targetUrl = base + filePath + search + hash;
        history.replaceState(history.state || null, "", targetUrl);
        await router.go(targetUrl);
        return;
      }
    }

    await router.onAfterUrlLoad?.(href);
  };

  if (executeBeforeMountFn) {
    onBeforeMount(async () => {
      if (!router.state.permalinkPlugin) router.state = { ...router.state, permalinkPlugin: true };
      await replaceUrlWhenPermalinkExist(window.location.href);
    });
  }

  /**
   * 尝试通过路由地址获取文件地址（当路由地址为 permalink 时才有值返回，否则返回空）
   *
   * @param pathname 访问的文档地址或 permalink
   */
  const teyGetFilePathByPermalink = (pathname: string) => {
    const decodePath =
      "/" +
      decodeURIComponent(pathname.slice(base.length))
        .replace(/\/$/, "")
        .replace(/\.html/, "");

    const li = localeIndex.value;
    // 假设为 permalink
    const maybeIsPermalink = cleanUrls ? decodePath : decodePath + ".html";
    // 实际的文件路径（防御性查找多种 key 格式）
    let filePath = "";

    if (li !== "root" && !maybeIsPermalink.startsWith(`/${li}/`)) {
      filePath =
        permalinks.inv[`/${li}${maybeIsPermalink}`] ||
        permalinks.inv[`${maybeIsPermalink.replace(/\/$/, "")}`] ||
        permalinks.inv[`${maybeIsPermalink}/`];
    } else {
      filePath =
        permalinks.inv[maybeIsPermalink] ||
        permalinks.inv[maybeIsPermalink.replace(/\/$/, "")] ||
        permalinks.inv[`${maybeIsPermalink}/`];
    }

    // 如果获取的文件路径和访问的路由地址一致，则返回空，不需要重复跳转
    if (`/${filePath}` === decodePath) return "";
    return filePath;
  };

  /**
   * 监听路由变化（刷新页面不会触发），处理路由地址
   */
  const startWatch = () => {
    if (!permalinkKeys.length) return;

    const state = router.state || {};
    // 防止重复在 router 添加函数
    if (state.permalinkPlugin) return;

    const selfOnBeforeRouteChange = router.onBeforeRouteChange;
    router.onBeforeRouteChange = async (href: string) => {
      // 调用已有的 onBeforeRouteChange
      const selfResult = await selfOnBeforeRouteChange?.(href);
      if (selfResult === false) return false;
      if (href === base) return;

      const { pathname, search, hash } = new URL(href, fakeHost);
      // 尝试获取文件路径（当 pathname 为 permalink 时才获取成功）
      const filePath = teyGetFilePathByPermalink(pathname);

      if (filePath) {
        const targetUrl = base + filePath + search + hash;
        await router.go(targetUrl);

        // 阻止本次路由跳转
        return false;
      }
    };

    const selfOnAfterRouteChange = router.onAfterRouteChange;
    router.onAfterRouteChange = async (href: string) => {
      // 如果 permalink 存在，则替换掉 URL
      await replaceUrlWhenPermalinkExist(href);
      // 调用已有的 onAfterRouteChange
      await selfOnAfterRouteChange?.(href);
    };

    router.state = { ...router.state, permalinkPlugin: true };
  };

  return { startWatch, teyGetFilePathByPermalink };
}

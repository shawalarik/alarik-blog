import type { InjectionKey } from "vue";

export const postDataUpdateSymbol: InjectionKey<() => void> = Symbol("postDataUpdate");
export const categoryPageQuerySyncSymbol: InjectionKey<() => void> = Symbol("categoryPageQuerySync");
export const routeQueryChangeEvent = "tk:route-query-change";

export const ensureRouteQueryObserver = () => {
  if (typeof window === "undefined") return;

  const patchedKey = "__tkRouteQueryObserverPatched__";
  const win = window as Window & { [patchedKey]?: boolean };
  if (win[patchedKey]) return;

  const dispatch = () => window.dispatchEvent(new Event(routeQueryChangeEvent));

  const wrapHistoryMethod = (method: "pushState" | "replaceState") => {
    const original = window.history[method];
    window.history[method] = function (...args) {
      const result = original.apply(this, args);
      dispatch();
      return result;
    };
  };

  wrapHistoryMethod("pushState");
  wrapHistoryMethod("replaceState");
  win[patchedKey] = true;
};

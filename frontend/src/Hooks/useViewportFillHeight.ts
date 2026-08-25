import { useLayoutEffect, useState } from "react";

/**
 * Measures the topbar's actual rendered height (via #app-topbar) instead of
 * assuming a fixed px value, so viewport-filling pages don't drift a few
 * pixels out of sync with the real layout and force a phantom page scroll.
 */
export const useViewportFillHeight = (fallback = "calc(100vh - 58px)") => {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const topbar = document.getElementById("app-topbar");
    if (!topbar) return;

    const update = () =>
      setHeight(window.innerHeight - topbar.getBoundingClientRect().height);

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(topbar);
    window.addEventListener("resize", update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return height != null ? `${height}px` : fallback;
};

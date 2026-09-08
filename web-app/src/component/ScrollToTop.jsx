import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const section = document.getElementById(hash.slice(1));
      if (section) {
        window.requestAnimationFrame(() => {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;

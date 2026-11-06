import { useState, useEffect, useRef, useCallback } from "react";
export function useNavigation() {
  const [path, setPath] = useState(location.pathname),
    current = useRef(location.pathname),
    scrolls = useRef(new Map());
  const transition = useCallback((next, write = true, replace = false) => {
    scrolls.current.set(current.current, window.scrollY);
    if (write) history[replace ? "replaceState" : "pushState"]({}, "", next);
    current.current = next;
    setPath(next);
    requestAnimationFrame(() =>
      window.scrollTo(0, scrolls.current.get(next) || 0),
    );
  }, []);
  useEffect(() => {
    const pop = () => transition(location.pathname, false);
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [transition]);
  return { path, navigate: transition };
}

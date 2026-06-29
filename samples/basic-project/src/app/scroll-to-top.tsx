'use client';
import { useEffect, useRef } from "react";

// Scrolls its parent element to the top of the viewport on mount, so the page
// content is on screen regardless of any header/footer rendered around it.
export default function ScrollToTop() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ref.current?.parentElement?.scrollIntoView({ block: 'start' });
  }, [ref.current]);
  return <span ref={ref} aria-hidden style={{ display: 'inline-block', height: 0, width: 0, position: 'relative', top: 0, left: 0 }} />;
}

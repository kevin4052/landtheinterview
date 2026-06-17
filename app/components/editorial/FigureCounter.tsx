"use client";

import { useEffect, useRef } from "react";

export function FigureCounter({
  value,
  suffix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          const duration = 1500;
          const start = performance.now();
          function tick(now: number) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el!.textContent = (value * eased).toFixed(decimals) + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else el!.textContent = value.toFixed(decimals) + suffix;
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, suffix, decimals]);

  return (
    <div ref={ref} className={className}>
      0
    </div>
  );
}

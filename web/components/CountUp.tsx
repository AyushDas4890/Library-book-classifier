"use client";
import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";

export default function CountUp({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, to, {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        node.textContent = (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, decimals, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

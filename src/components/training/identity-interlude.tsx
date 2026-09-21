"use client";

import { useEffect, useRef } from "react";

function OrbitLeaf({ angle, delay }: { angle: number; delay: number }) {
  return (
    <svg
      className="orbit-leaf"
      style={
        {
          "--angle": `${angle}deg`,
          "--delay": `${delay}ms`,
        } as React.CSSProperties
      }
      viewBox="0 0 60 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 2C30 2 40 18 42 40C44 58 35 75 30 78C25 75 16 58 18 40C20 18 30 2 30 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IdentityInterlude() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      const element = containerRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;

      const distance = elementCenter - viewportCenter;
      const viewportHeight = window.innerHeight;

      const scrollProgress = Math.max(0, Math.min(1, (viewportHeight / 2 - distance) / viewportHeight));

      const rotation = scrollProgress * 180;

      const leafGroup = element.querySelector(".orbit-group");
      if (leafGroup) {
        (leafGroup as HTMLElement).style.transform = `rotate(${rotation}deg)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="identity-interlude" ref={containerRef} aria-label="Zadok identity">
      <div className="identity-interlude-spacing" />

      <div className="identity-center">
        <div className="orbit-group">
          <div className="orbit-leaf-0">
            <OrbitLeaf angle={0} delay={0} />
          </div>
          <div className="orbit-leaf-1">
            <OrbitLeaf angle={60} delay={200} />
          </div>
          <div className="orbit-leaf-2">
            <OrbitLeaf angle={120} delay={400} />
          </div>
          <div className="orbit-leaf-3">
            <OrbitLeaf angle={180} delay={600} />
          </div>
          <div className="orbit-leaf-4">
            <OrbitLeaf angle={240} delay={800} />
          </div>
          <div className="orbit-leaf-5">
            <OrbitLeaf angle={300} delay={1000} />
          </div>

          <div className="identity-mark">Z</div>
        </div>
      </div>

      <div className="identity-interlude-spacing" />
    </section>
  );
}

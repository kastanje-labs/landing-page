import { useEffect, useRef } from "react";
import { chestnutPixels } from "../chestnut";

// A face for the landing illustration; the permanent brand mark stays faceless.
export function CuriousChestnut({ running }: { running: boolean }) {
  const host = useRef<SVGSVGElement>(null);
  const gaze = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = host.current;
    const eyes = gaze.current;
    if (!svg || !eyes || !running) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      eyes.style.transform = `translate(${x}px, ${y}px)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const follow = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = svg.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      const distance = Math.hypot(dx, dy);
      const reach = Math.max(180, distance);
      x = (dx / reach) * 0.7;
      y = (dy / reach) * 0.42;
      schedule();
    };
    const rest = () => {
      x = 0;
      y = 0;
      schedule();
    };
    document.addEventListener("pointermove", follow, { passive: true });
    document.documentElement.addEventListener("pointerleave", rest);
    window.addEventListener("blur", rest);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", follow);
      document.documentElement.removeEventListener("pointerleave", rest);
      window.removeEventListener("blur", rest);
      eyes.style.transform = "translate(0px, 0px)";
    };
  }, [running]);

  return (
    <svg
      ref={host}
      className="lp-curious-chestnut"
      viewBox="0 0 16 17"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <g>
        {chestnutPixels.map((pixel, i) => (
          <rect
            key={i}
            x={pixel.x}
            y={pixel.y}
            width=".82"
            height=".82"
            fill={`var(--chestnut-${pixel.tone}, ${pixel.color})`}
          />
        ))}
      </g>
      <g className="lp-chestnut-gaze" ref={gaze}>
        <g className="lp-chestnut-blink" fill="#36261f">
          <rect x="5.3" y="6.4" width="1.15" height="1.65" />
          <rect x="9.3" y="6.4" width="1.15" height="1.65" />
        </g>
      </g>
    </svg>
  );
}

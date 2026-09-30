import { useEffect, useRef, useState } from "react";
import { chestnutPixels } from "../chestnut";

export function ChestnutMark({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 17"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {chestnutPixels.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width=".82"
          height=".82"
          fill={`var(--chestnut-${p.tone}, ${p.color})`}
        />
      ))}
    </svg>
  );
}
export function LivingChestnut() {
  const host = useRef<HTMLButtonElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    time = useRef(0),
    poke = useRef(() => {});
  const [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(false);
  useEffect(() => {
    const button = host.current,
      surface = canvas.current;
    if (!button || !surface) return;
    const ctx = surface.getContext("2d");
    if (!ctx) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      visible = true,
      last = 0,
      width = 450,
      height = 360,
      pulse = 0,
      gazeX = 0,
      gazeY = 0,
      px = 10000,
      py = 10000,
      inside = false;
    const cells = chestnutPixels.map((p, i) => ({
      ...p,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      phase: i * 2.399,
    }));
    let palette: Record<string, string> = {};
    let eyeWidth = 14,
      eyeHeight = 18,
      eyeGap = 34.6,
      eyeY = -15.35;
    function readAppearance() {
      const style = getComputedStyle(button!);
      palette = Object.fromEntries(
        chestnutPixels.map((p) => [
          p.tone,
          style.getPropertyValue(`--chestnut-${p.tone}`).trim() || p.color,
        ]),
      );
      eyeWidth =
        parseFloat(style.getPropertyValue("--chestnut-eye-width")) || 14;
      eyeHeight =
        parseFloat(style.getPropertyValue("--chestnut-eye-height")) || 18;
      eyeGap = parseFloat(style.getPropertyValue("--chestnut-eye-gap")) || 34.6;
      eyeY = parseFloat(style.getPropertyValue("--chestnut-eye-y")) || -15.35;
    }
    function draw(timestamp: number) {
      frame = 0;
      if (!ctx || !surface || !button) return;
      const still = paused || motion.matches,
        dt = Math.min((timestamp - (last || timestamp - 16)) / 1000, 0.04);
      last = timestamp;
      if (!still) {
        time.current += dt;
        pulse *= Math.exp(-dt * 4);
      }
      const t = time.current,
        scale = Math.min(width / 450, height / 360),
        cell = 17.3 * scale;
      const centerX = width / 2,
        centerY = height * 0.44;
      const bob = still ? 0 : Math.sin(t * 1.5) * 3 * scale;
      const breathe = still ? 1 : 1 + Math.sin(t * 1.3) * 0.009 + pulse * 0.018;
      const targetX = inside
        ? Math.max(-1, Math.min(1, (px - centerX) / 160))
        : Math.sin(t * 0.43) * 0.23;
      const targetY = inside
        ? Math.max(-1, Math.min(1, (py - centerY) / 130))
        : Math.sin(t * 0.31) * 0.1;
      if (!still) {
        gazeX += (targetX - gazeX) * Math.min(1, dt * 8);
        gazeY += (targetY - gazeY) * Math.min(1, dt * 8);
      }
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle =
        document.documentElement.dataset.theme === "dark"
          ? "#f3dcb014"
          : "#50302012";
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        height * 0.91,
        88 * scale,
        7 * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.save();
      ctx.translate(centerX, centerY + bob);
      ctx.scale(breathe, 1 / breathe);
      const blink =
        !still && (t % 5.8 > 5.55 || (pulse > 0.58 && pulse < 0.82));
      const openingHeight = (blink ? 1.5 : eyeHeight) * scale;
      let omitted = 0;
      for (const p of cells) {
        const x = (p.x - 7.9) * cell,
          y = (p.y - 8.4) * cell;
        const rx = centerX + x - px,
          ry = centerY + y - py,
          dist = Math.hypot(rx, ry) || 1;
        const repulsion =
          !still && inside ? Math.max(0, 1 - dist / (76 * scale)) : 0;
        const tx = still
          ? 0
          : (rx / dist) * repulsion * 10 * scale +
            Math.cos(p.phase) * pulse * 17 * scale;
        const ty = still
          ? 0
          : (ry / dist) * repulsion * 10 * scale +
            Math.sin(p.phase) * pulse * 17 * scale;
        if (still) {
          p.dx = 0;
          p.dy = 0;
        } else {
          p.vx = (p.vx + (tx - p.dx) * dt * 85) * Math.exp(-dt * 11);
          p.vy = (p.vy + (ty - p.dy) * dt * 85) * Math.exp(-dt * 11);
          p.dx += p.vx * dt;
          p.dy += p.vy * dt;
        }
        const cx = x + p.dx + cell * 0.41;
        const cy = y + p.dy + cell * 0.41;
        const inOpening = [-1, 1].some((sign) => {
          const ex =
            (sign * eyeGap + 1.9) * scale + (still ? 0 : gazeX * 5 * scale);
          const ey = eyeY * scale + (still ? 0 : gazeY * 4 * scale);
          return (
            ((cx - ex) / (eyeWidth * scale)) ** 2 +
              ((cy - ey) / openingHeight) ** 2 <
            1
          );
        });
        // The eyes are holes in the existing grid: omitted pixels, no painted layer.
        if (inOpening) {
          omitted++;
          continue;
        }
        ctx.fillStyle = palette[p.tone] || p.color;
        ctx.fillRect(x + p.dx, y + p.dy, cell * 0.82, cell * 0.82);
      }
      button.dataset.eyePixelsOmitted = String(omitted);
      ctx.restore();
      if (!still && visible && !document.hidden)
        frame = requestAnimationFrame(draw);
    }
    function wake() {
      readAppearance();
      if (frame) cancelAnimationFrame(frame);
      last = 0;
      if (paused || motion.matches) draw(performance.now());
      else frame = requestAnimationFrame(draw);
    }
    function resize() {
      if (!button || !surface) return;
      const box = button.getBoundingClientRect();
      width = box.width;
      height = box.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      wake();
    }
    function pointer(e: PointerEvent) {
      const box = button!.getBoundingClientRect();
      px = e.clientX - box.left;
      py = e.clientY - box.top;
      inside = true;
    }
    function leave() {
      inside = false;
      px = py = 10000;
    }
    function preference() {
      setReduced(motion.matches);
      wake();
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (visible) wake();
    }
    poke.current = () => {
      if (!paused && !motion.matches) {
        pulse = 1;
        for (const p of cells) {
          p.vx += Math.cos(p.phase) * 150;
          p.vy += Math.sin(p.phase) * 150;
        }
        wake();
      }
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(button);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) wake();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    intersection.observe(button);
    const theme = new MutationObserver(wake);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-study"],
    });
    button.addEventListener("pointermove", pointer);
    button.addEventListener("pointerleave", leave);
    motion.addEventListener("change", preference);
    document.addEventListener("visibilitychange", visibility);
    preference();
    resize();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      theme.disconnect();
      button.removeEventListener("pointermove", pointer);
      button.removeEventListener("pointerleave", leave);
      motion.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", visibility);
      poke.current = () => {};
    };
  }, [paused]);
  return (
    <div className="chestnut-scene">
      <button
        ref={host}
        className="chestnut-touch"
        data-eye-style="grid-cutout"
        aria-label="Play with the Kastanje chestnut"
        onClick={() => poke.current()}
      >
        <canvas ref={canvas} aria-hidden="true" />
        <span className="sr-only">
          A pixel chestnut follows your pointer and reacts to a tap.
        </span>
      </button>
      {!reduced && (
        <button
          className="chestnut-pause"
          aria-label={
            paused ? "Resume chestnut animation" : "Pause chestnut animation"
          }
          onClick={() => setPaused((p) => !p)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            {paused ? (
              <path d="M4 2l8 5-8 5z" fill="currentColor" />
            ) : (
              <path d="M3 2h3v10H3zm5 0h3v10H8z" fill="currentColor" />
            )}
          </svg>
        </button>
      )}
    </div>
  );
}

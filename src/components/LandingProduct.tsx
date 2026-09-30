import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "./PixelIcon";
import { useAppUrl } from "./Theme";
import { landingPreviewEnabled } from "../landing-scenes";
import {
  LandingProductGraphic,
  type GraphicVariant,
} from "./LandingProductGraphic";

const steps = [
  {
    title: "Vælg med overblik",
    description:
      "Sammenlign kvalitet og pris. Find modellen, der passer til opgaven, med en pris for den EU-rute, du kan bruge.",
    label: "Sammenlign modeller",
    href: "/app/compare",
    diagram: "compare",
  },
  {
    title: "Forbind en gang",
    description:
      "Forbind dit værktøj med din Kastanje-nøgle. Skift mellem modeller gennem samme API, uden en ny leverandørkonto hver gang.",
    label: "Se API-adgang",
    href: "/app/projects",
    diagram: "route",
  },
  {
    title: "Følg dit forbrug",
    description:
      "Se, hvad dine projekter bruger. Få mindst 1 % tilbage i bonuscredits på betalt inference, og brug dem til dine næste forespørgsler.",
    label: "Åbn dit overblik",
    href: "/app",
    diagram: "usage",
  },
] as const;
const variants = [
  ["final", "Valgt"],
  ["a", "Strøm"],
  ["b", "Pixels"],
  ["c", "Kvittering"],
] as const;

export function LandingProduct() {
  const appUrl = useAppUrl();
  const [selected, setSelected] = useState(0);
  const [model, setModel] = useState(1);
  const [variant, setVariant] = useState<GraphicVariant>(() => {
    const value = new URLSearchParams(location.search).get("grafik");
    return landingPreviewEnabled(location.hostname, location.search) &&
      (value === "a" || value === "b" || value === "c")
      ? value
      : "final";
  });
  const showVariants =
    landingPreviewEnabled(location.hostname, location.search) &&
    new URLSearchParams(location.search).has("grafik");
  const runway = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const manual = useRef(false);
  const [scrollable, setScrollable] = useState(false);
  const [stageHeight, setStageHeight] = useState(440);

  useEffect(() => {
    const track = runway.current;
    const panel = stage.current;
    if (!track || !panel) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let enabled = false;
    let frame = 0;
    const updateStep = () => {
      frame = 0;
      if (!enabled || manual.current) return;
      const bounds = track.getBoundingClientRect();
      const distance = track.offsetHeight - panel.offsetHeight;
      if (distance <= 0) return;
      const top = Number.parseFloat(getComputedStyle(panel).top) || 24;
      // The first and last step stay visible while the stage enters and leaves.
      const progress = Math.max(0, Math.min(1, (top - bounds.top) / distance));
      setSelected(Math.min(2, Math.floor(progress * 3)));
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(updateStep);
    };
    const resize = () => {
      setStageHeight(panel.offsetHeight);
      enabled = !reduced.matches && innerHeight >= panel.offsetHeight + 60;
      setScrollable(enabled);
      scroll();
    };
    const observer = new ResizeObserver(resize);
    const resumeScroll = () => {
      manual.current = false;
    };
    const resumeKeyboardScroll = (event: KeyboardEvent) => {
      if (
        ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(
          event.key,
        )
      )
        resumeScroll();
    };
    observer.observe(panel);
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("wheel", resumeScroll, { passive: true });
    addEventListener("touchmove", resumeScroll, { passive: true });
    addEventListener("keydown", resumeKeyboardScroll);
    addEventListener("resize", resize);
    reduced.addEventListener("change", resize);
    resize();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      removeEventListener("scroll", scroll);
      removeEventListener("wheel", resumeScroll);
      removeEventListener("touchmove", resumeScroll);
      removeEventListener("keydown", resumeKeyboardScroll);
      removeEventListener("resize", resize);
      reduced.removeEventListener("change", resize);
    };
  }, []);

  function selectStep(index: number) {
    manual.current = true;
    setSelected(index);
    if (!scrollable || !runway.current || !stage.current) return;
    const panel = stage.current;
    const track = runway.current;
    const offset = Number.parseFloat(getComputedStyle(panel).top) || 24;
    const distance = track.offsetHeight - panel.offsetHeight;
    // Native scrolling remains in control. Clicking a step goes to its position.
    scrollTo({
      top:
        scrollY +
        track.getBoundingClientRect().top -
        offset +
        (distance * (index + 0.2)) / 3,
      behavior: "instant",
    });
  }
  const current = steps[selected];
  return (
    <section
      className="lc-product lc-wrap"
      id="produkt"
      aria-labelledby="lc-product-title"
    >
      <div
        className="lp-runway"
        ref={runway}
        data-scroll={scrollable}
        style={
          scrollable
            ? { height: `calc(${stageHeight}px + clamp(420px, 65svh, 650px))` }
            : undefined
        }
      >
        <div
          className="lp-story"
          ref={stage}
          onPointerDown={() => {
            manual.current = true;
          }}
          onFocusCapture={() => {
            manual.current = true;
          }}
        >
          <div className="lc-section-heading">
            <p className="lc-eyebrow">Fra valg til virkelighed</p>
            <h2 id="lc-product-title">
              Du bygger idéen.
              <br />
              <span>Vi samler forbindelserne.</span>
            </h2>
          </div>
          {showVariants && (
            <nav className="lp-variants" aria-label="Grafikforslag">
              <span>Grafik</span>
              {variants.map(([key, title]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={variant === key}
                  onClick={() => {
                    setVariant(key);
                    const url = new URL(location.href);
                    url.searchParams.set("grafik", key);
                    history.replaceState(null, "", url);
                  }}
                >
                  {key !== "final" && <b>{key.toUpperCase()}</b>} {title}
                </button>
              ))}
            </nav>
          )}
          <div className="lc-product-grid lp-stage" data-step={selected + 1}>
            <div className="lc-product-choices" aria-label="Udforsk produktet">
              {steps.map((step, index) => (
                <button
                  key={step.title}
                  id={`lc-choice-${index}`}
                  type="button"
                  aria-pressed={selected === index}
                  aria-controls="lc-product-view"
                  onClick={() => selectStep(index)}
                >
                  <span className="lc-step-number">0{index + 1}</span>
                  <span className="lc-step-copy">
                    <strong>{step.title}</strong>
                    <span
                      className="lc-step-fold"
                      aria-hidden={selected !== index}
                    >
                      <span className="lc-step-description">
                        {step.description}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </div>
            <div
              className="lc-product-view"
              id="lc-product-view"
              role="region"
              aria-labelledby={`lc-choice-${selected}`}
            >
              <p className="lc-product-mobile-description">
                {current.description}
              </p>
              <LandingProductGraphic
                view={current.diagram}
                variant={variant}
                model={model}
                onModelChange={setModel}
              />
              <a className="lc-text-link" href={appUrl(current.href)}>
                {current.label}
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

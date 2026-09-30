import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChestnutMark } from "./Chestnut";
import { CuriousChestnut } from "./CuriousChestnut";
import { PILOT_CASHBACK_PERCENT } from "../shared";
import { LandingActivity } from "./LandingActivity";
import "../landing-product.css";

// One motion policy for the small illustrations and the project-logo strip.
export function useVisibleMotion() {
  const host = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = host.current?.getBoundingClientRect();
      setReduced(media.matches);
      setVisible(
        Boolean(
          rect && rect.bottom > 0 && rect.top < innerHeight && !document.hidden,
        ),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Measure the sticky story at its painted position, including after hash navigation.
    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return {
    host,
    paused,
    reduced,
    running: visible && !paused && !reduced,
    toggle: () => setPaused(!paused),
  };
}

export type GraphicVariant = "final" | "a" | "b" | "c";
type View = "compare" | "route" | "usage";
const models = [
  { name: "Model A", quality: 88, price: 2.4 },
  { name: "Model B", quality: 80, price: 1.2 },
  { name: "Model C", quality: 66, price: 0.6 },
];
const volume = [22, 31, 27, 43, 39, 49, 61, 54, 70, 63, 81, 74, 88, 96];
const money = new Intl.NumberFormat("da-DK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function useAnimatedMetric(target: number, running: boolean, reduced: boolean) {
  const current = useRef(target);
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (!running) {
      current.current = target;
      setValue(target);
      return;
    }
    if (current.current === target) return;
    let frame = 0;
    const from = current.current;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 600);
      current.current =
        from + (target - from) * (1 - Math.pow(1 - progress, 3));
      setValue(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, running]);
  return reduced || !running ? target : value;
}

function useExampleSpend(running: boolean, reduced: boolean) {
  const elapsed = useRef(0);
  const [cents, setCents] = useState(10_000);
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    let paint = last;
    const tick = (now: number) => {
      elapsed.current += Math.min(100, now - last);
      last = now;
      if (now - paint > 90) {
        // 100 → 500 kr., then a short hold. This is always labelled an example.
        const progress = Math.min(1, (elapsed.current % 20_000) / 16_000);
        setCents(10_000 + Math.round(40_000 * progress));
        paint = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  return reduced ? 10_000 : cents;
}

export function LandingProductGraphic({
  view,
  variant,
  model,
  onModelChange,
}: {
  view: View;
  variant: GraphicVariant;
  model: number;
  onModelChange: (model: number) => void;
}) {
  const motion = useVisibleMotion();
  const cents = useExampleSpend(
    motion.running && view === "usage" && variant !== "final",
    motion.reduced,
  );
  const spend = cents / 100;
  const cashback = Math.round((cents * PILOT_CASHBACK_PERCENT) / 100) / 100;
  const chosen = models[model];
  const final = variant === "final";
  const manualModel = useRef(false);
  const quality = useAnimatedMetric(
    chosen.quality,
    motion.running && view === "compare",
    motion.reduced,
  );
  const price = useAnimatedMetric(
    chosen.price,
    motion.running && view === "compare",
    motion.reduced,
  );
  useEffect(() => {
    if (!final || view !== "compare" || !motion.running || manualModel.current)
      return;
    const next = window.setTimeout(() => {
      if (!manualModel.current) onModelChange((model + 1) % models.length);
    }, 5500);
    return () => clearTimeout(next);
  }, [final, view, motion.running, model, onModelChange]);
  const chooseModel = (index: number) => {
    manualModel.current = true;
    onModelChange(index);
  };
  const route = `M281 130H337${model === 0 ? "Q357 130 357 110V70Q357 50 377 50H438" : model === 1 ? "H438" : "Q357 130 357 150V190Q357 210 377 210H438"}`;
  return (
    <div
      ref={motion.host}
      className={`lp-graphic lp-graphic--${variant}`}
      data-view={view}
      data-running={motion.running}
      data-reduced={motion.reduced}
      data-model={model}
    >
      <div className="lp-graphic-heading">
        <span>
          {view === "compare"
            ? "Find dit match"
            : view === "route"
              ? "En nøgle. Flere muligheder."
              : final
                ? "Forbruget, dag for dag."
                : "Forbruget vokser. Cashback følger med."}
        </span>
        {final && view === "usage" && (
          <span className="lp-period">30 dage</span>
        )}
        <button
          type="button"
          disabled={motion.reduced}
          onClick={motion.toggle}
          aria-pressed={motion.paused || motion.reduced}
          aria-label={
            motion.reduced
              ? "Reduceret bevægelse er slået til"
              : motion.paused
                ? "Afspil illustration"
                : "Sæt illustration på pause"
          }
        >
          <span aria-hidden="true">
            {motion.paused || motion.reduced ? "▶" : "Ⅱ"}
          </span>
        </button>
      </div>
      <div className="lp-graphic-body" key={`${variant}-${view}`}>
        {view === "compare" ? (
          <>
            {variant === "a" ? (
              <div className="lp-compare-bars">
                <div className="lp-compare-labels">
                  <span>Eksempelmodel</span>
                  <span>Kvalitet / 100</span>
                  <span>Pris / 1 mio.</span>
                </div>
                {models.map((item, i) => (
                  <button
                    key={item.name}
                    type="button"
                    className="lp-model-row"
                    aria-pressed={model === i}
                    onClick={() => chooseModel(i)}
                  >
                    <span className="lp-model-name">
                      <i />
                      {item.name}
                    </span>
                    <span className="lp-metric">
                      <b>{item.quality}</b>
                      <span className="lp-track">
                        <i
                          style={
                            { "--fill": `${item.quality}%` } as CSSProperties
                          }
                        />
                      </span>
                    </span>
                    <span className="lp-metric lp-metric--price">
                      <b>€{money.format(item.price)}</b>
                      <span className="lp-track">
                        <i
                          style={
                            {
                              "--fill": `${(item.price / 3) * 100}%`,
                            } as CSSProperties
                          }
                        />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : variant === "b" ? (
              <div className="lp-model-tiles">
                {models.map((item, i) => (
                  <button
                    key={item.name}
                    type="button"
                    aria-pressed={model === i}
                    onClick={() => chooseModel(i)}
                  >
                    <span>{item.name}</span>
                    <span className="lp-pixel-matrix" aria-hidden="true">
                      {Array.from({ length: 25 }, (_, n) => (
                        <i
                          key={n}
                          data-filled={n < Math.round(item.quality / 4)}
                        />
                      ))}
                    </span>
                    <strong>
                      {item.quality}
                      <small>/100</small>
                    </strong>
                    <span className="lp-tile-price">
                      €{money.format(item.price)}
                      <small>pr. 1 mio. tokens</small>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="lp-compare-editorial">
                <div
                  className="lp-model-pills"
                  role="group"
                  aria-label="Vælg eksempelmodel"
                  onFocusCapture={() => {
                    manualModel.current = true;
                  }}
                  style={{ "--model": model } as CSSProperties}
                >
                  {final && (
                    <span className="lp-model-highlight" aria-hidden="true" />
                  )}
                  {models.map((item, i) => (
                    <button
                      type="button"
                      key={item.name}
                      aria-pressed={model === i}
                      onClick={() => chooseModel(i)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <div className="lp-score-pair">
                  <div>
                    <span>Kvalitet</span>
                    <strong>
                      {final ? Math.round(quality) : chosen.quality}
                      <small>/100</small>
                    </strong>
                  </div>
                  <div>
                    <span>Pris pr. 1 mio. tokens</span>
                    <strong>
                      €{money.format(final ? price : chosen.price)}
                    </strong>
                  </div>
                </div>
                <div
                  className="lp-quality-ruler"
                  key={model}
                  aria-hidden="true"
                >
                  {Array.from({ length: 20 }, (_, i) => (
                    <i
                      key={i}
                      data-filled={i < chosen.quality / 5}
                      style={{ "--delay": `${i * 22}ms` } as CSSProperties}
                    />
                  ))}
                </div>
              </div>
            )}
            <p className="lp-selected-note">
              <span aria-hidden="true">↗</span>
              {model === 0
                ? "Til opgaver, hvor kvaliteten vejer tungest."
                : model === 1
                  ? "8 point fra A. Halvdelen af prisen."
                  : "Til de mindre opgaver og budgetter."}
            </p>
          </>
        ) : view === "route" ? (
          <div className="lp-routing">
            <div className="lp-routing-canvas">
              <svg
                className="lp-route-lines"
                viewBox="0 0 600 260"
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id="lp-route-arrow"
                    viewBox="0 0 8 8"
                    refX="7"
                    refY="4"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M1 1L4 4 1 7" />
                  </marker>
                </defs>
                <path
                  className="lp-route-track"
                  d="M91 130H209 M281 130H337Q357 130 357 110V70Q357 50 377 50H438 M281 130H438 M281 130H337Q357 130 357 150V190Q357 210 377 210H438"
                />
                <path
                  className="lp-route-selected"
                  markerEnd="url(#lp-route-arrow)"
                  d={route}
                />
                {final ? (
                  <g key={model}>
                    <path
                      className="lp-route-signal lp-route-signal--in"
                      d="M91 130H209"
                      pathLength="100"
                    />
                    <path
                      className="lp-route-signal lp-route-signal--out"
                      d={route}
                      pathLength="100"
                    />
                  </g>
                ) : (
                  <path
                    className="lp-route-packets"
                    d={`M91 130H209 ${route}`}
                  />
                )}
              </svg>
              <div className="lp-source">
                <span className="lp-code" aria-hidden="true">
                  &lt;/&gt;
                </span>
                <span>Din app</span>
              </div>
              <div className="lp-hub">
                <div className="lp-hub-mark">
                  {final ? (
                    <CuriousChestnut running={motion.running} />
                  ) : (
                    <ChestnutMark size={64} />
                  )}
                </div>
                <span>kastanje</span>
              </div>
              {models.map((item, i) => (
                <button
                  key={item.name}
                  type="button"
                  className="lp-destination"
                  style={{ top: `${((50 + i * 80) / 260) * 100}%` }}
                  aria-pressed={model === i}
                  onClick={() => chooseModel(i)}
                >
                  {item.name}
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="lp-routing-caption">
              Vælg en model. Forbindelsen er den samme.
            </p>
          </div>
        ) : final ? (
          <LandingActivity running={motion.running} reduced={motion.reduced} />
        ) : (
          <div className="lp-usage">
            <div className="lp-usage-total">
              <span>Betalt forbrug</span>
              <strong>
                {money.format(spend)}
                <small> kr.</small>
              </strong>
            </div>
            {variant === "a" ? (
              <>
                <div className="lp-volume" aria-hidden="true">
                  {volume.map((height, i) => (
                    <i
                      key={i}
                      style={
                        {
                          "--volume": `${Math.min(100, height * (0.55 + spend / 1100))}%`,
                          "--delay": `${i * 50}ms`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
                <div className="lp-volume-labels">
                  <span>Forbrug over tid</span>
                  <span>→</span>
                </div>
              </>
            ) : variant === "b" ? (
              <div className="lp-bonus-field" aria-hidden="true">
                {Array.from({ length: 60 }, (_, i) => (
                  <i key={i} data-filled={i < (spend / 500) * 60} />
                ))}
              </div>
            ) : (
              <dl className="lp-receipt">
                <div>
                  <dt>Betalt inference</dt>
                  <dd>{money.format(spend)} kr.</dd>
                </div>
                <div>
                  <dt>Cashback</dt>
                  <dd>{PILOT_CASHBACK_PERCENT} %</dd>
                </div>
                <div>
                  <dt>Til næste forespørgsel</dt>
                  <dd>↓</dd>
                </div>
              </dl>
            )}
            <div className="lp-cashback">
              <span className="lp-cashback-sign" aria-hidden="true">
                ↗
              </span>
              <span>
                Mindst {PILOT_CASHBACK_PERCENT} % tilbage
                <small>i bonuscredits</small>
              </span>
              <strong>
                +{money.format(cashback)}
                <small> kr.</small>
              </strong>
            </div>
          </div>
        )}
      </div>
      <p className="lp-example">
        {view === "usage"
          ? "Regneeksempel · ikke din saldo"
          : "Illustration · eksempeldata"}
      </p>
    </div>
  );
}

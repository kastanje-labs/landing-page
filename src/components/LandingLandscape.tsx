import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "./PixelIcon";
import {
  clockInDenmark,
  dayParts,
  dayLabels,
  dayHours,
  places,
  placeLabels,
  landscapeScene,
  pickPlace,
  sceneInDenmark,
  scenePreviewOptions,
  type DayPart,
  type SceneMode,
  type Place,
  type LandscapeScene,
} from "../landing-scenes";
import "../landing-landscape.css";

function pickForVisit(part: DayPart): Place {
  let last: Place | null = null;
  try {
    const saved = sessionStorage.getItem(`kastanje-landscape-${part}`);
    last = places.find((place) => place === saved) ?? null;
  } catch {
    /* Storage is optional. */
  }
  const place = pickPlace(last);
  try {
    sessionStorage.setItem(`kastanje-landscape-${part}`, place);
  } catch {
    /* Private browsing can disable storage. */
  }
  return place;
}

export function LandingLandscape({
  visible,
  onSceneChange,
}: {
  visible: boolean;
  onSceneChange: (scene: LandscapeScene) => void;
}) {
  const preview = scenePreviewOptions(location.hostname, location.search);
  const [now, setNow] = useState(() => new Date());
  const [mode, setMode] = useState<SceneMode>(() => preview.mode);
  const [placeMode, setPlaceMode] = useState<Place | null>(() => preview.place);
  const [scene, setScene] = useState(() => {
    const mode = preview.mode;
    const part = mode === "auto" ? sceneInDenmark(new Date()) : mode;
    return landscapeScene(part, preview.place ?? pickForVisit(part));
  });
  const [previous, setPrevious] = useState<LandscapeScene | null>(null);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(
    () => !document.hidden,
  );
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const animate = visible && documentVisible && !paused && !reduced;
  const part = mode === "auto" ? sceneInDenmark(now) : mode;

  function changeScene(next: LandscapeScene) {
    if (next.id === scene.id) return;
    setPrevious(scene);
    setScene(next);
  }
  useEffect(() => {
    if (part !== scene.part) {
      setPrevious(scene);
      setScene(landscapeScene(part, placeMode ?? pickForVisit(part)));
    }
  }, [part, scene, placeMode]);
  useEffect(() => {
    onSceneChange({ ...scene });
  }, [scene, mode, placeMode, onSceneChange]);
  useEffect(() => {
    const timer = window.setTimeout(() => setPrevious(null), 800);
    return () => window.clearTimeout(timer);
  }, [scene]);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduced(media.matches);
    const visibility = () => {
      setDocumentVisible(!document.hidden);
      setNow(new Date());
    };
    const navigation = () => {
      const next = scenePreviewOptions(location.hostname, location.search);
      const nextMode = next.mode;
      const nextPlace = next.place;
      setMode(nextMode);
      setPlaceMode(nextPlace);
      setNow(new Date());
      const nextPart =
        nextMode === "auto" ? sceneInDenmark(new Date()) : nextMode;
      setScene((current) =>
        landscapeScene(
          nextPart,
          nextPlace ??
            (current.part === nextPart
              ? current.place
              : pickForVisit(nextPart)),
        ),
      );
    };
    const timer = window.setInterval(() => {
      if (!document.hidden) setNow(new Date());
    }, 30_000);
    media.addEventListener("change", preference);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("popstate", navigation);
    return () => {
      window.clearInterval(timer);
      media.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("popstate", navigation);
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (animate && !failed[scene.id]) {
      void element
        .play()
        .catch(() => setPlaying((state) => ({ ...state, [scene.id]: false })));
    } else element.pause();
  }, [scene.id, animate, failed]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!controls.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function updateQuery(nextMode: SceneMode, nextPlace: Place | null) {
    const url = new URL(location.href);
    if (nextMode === "auto") url.searchParams.delete("tid");
    else url.searchParams.set("tid", nextMode);
    if (nextPlace) url.searchParams.set("sted", nextPlace);
    else url.searchParams.delete("sted");
    history.replaceState(null, "", url);
  }
  function chooseTime(value: SceneMode) {
    setMode(value);
    updateQuery(value, placeMode);
  }
  function choosePlace(value: Place | null) {
    setPlaceMode(value);
    updateQuery(mode, value);
    changeScene(landscapeScene(part, value ?? pickPlace(scene.place)));
  }

  return (
    <>
      <div
        className="lc-art lc-time-art"
        data-scene={scene.part}
        data-place={scene.place}
        data-motion={animate ? "playing" : "paused"}
      >
        {previous && (
          <img
            className="lc-scene-previous"
            data-scene-id={previous.id}
            src={`/landing/${previous.id}.jpg`}
            alt=""
            aria-hidden="true"
          />
        )}
        <div
          className="lc-time-scene is-current"
          data-scene-id={scene.id}
          key={scene.id}
        >
          <img
            src={`/landing/${scene.id}.jpg`}
            alt={scene.alt}
            width="1280"
            height="720"
            fetchPriority="high"
          />
          {!reduced && !failed[scene.id] && (
            <video
              ref={video}
              src={
                animate || playing[scene.id]
                  ? `/landing/${scene.id}.mp4`
                  : undefined
              }
              className={playing[scene.id] ? "is-ready" : ""}
              poster={`/landing/${scene.id}.jpg`}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
              onPlaying={() =>
                setPlaying((state) => ({ ...state, [scene.id]: true }))
              }
              onError={() =>
                setFailed((state) => ({ ...state, [scene.id]: true }))
              }
            />
          )}
        </div>
      </div>
      <div
        className={`lc-scene-controls${preview.enabled ? "" : " lc-scene-controls--public"}`}
        ref={controls}
      >
        <div className="lc-scene-bar">
          {preview.enabled && (
            <button
              ref={trigger}
              className="lc-scene-trigger"
              type="button"
              aria-expanded={open}
              aria-controls="lc-scene-settings"
              onClick={() => setOpen(!open)}
            >
              <span
                className={`lc-day-symbol lc-day-symbol--${scene.part}`}
                aria-hidden="true"
              />
              <span>{scene.caption}</span>
              <ChevronDown size={14} />
            </button>
          )}
          <button
            className="lc-scene-pause"
            type="button"
            disabled={reduced}
            aria-pressed={paused || reduced}
            aria-label={
              reduced
                ? "Reduceret bevægelse er slået til"
                : paused
                  ? "Afspil video"
                  : "Sæt video på pause"
            }
            onClick={() => setPaused(!paused)}
          >
            <span aria-hidden="true">{paused || reduced ? "▶" : "Ⅱ"}</span>
          </button>
        </div>
        {preview.enabled && open && (
          <div id="lc-scene-settings" className="lc-scene-settings">
            <div className="lc-scene-heading">
              <span>En dag i Danmark</span>
              <time dateTime={now.toISOString()}>{clockInDenmark(now)}</time>
            </div>
            <fieldset>
              <legend className="lc-visually-hidden">Vælg tidspunkt</legend>
              {dayParts.map((p) => (
                <label key={p} className="lc-time-option">
                  <input
                    type="radio"
                    name="landing-time"
                    value={p}
                    checked={mode === p}
                    onChange={() => chooseTime(p)}
                  />
                  <span
                    className={`lc-day-symbol lc-day-symbol--${p}`}
                    aria-hidden="true"
                  />
                  <strong>{dayLabels[p]}</strong>
                  <span className="lc-time-hours">{dayHours[p]}</span>
                </label>
              ))}
              <label className="lc-time-auto">
                <input
                  type="radio"
                  name="landing-time"
                  value="auto"
                  checked={mode === "auto"}
                  onChange={() => chooseTime("auto")}
                />
                <span>Følg dansk tid</span>
              </label>
            </fieldset>
            <label className="lc-place-label">
              Sted
              <select
                value={placeMode ?? "auto"}
                onChange={(e) =>
                  choosePlace(
                    e.target.value === "auto"
                      ? null
                      : (e.target.value as Place),
                  )
                }
              >
                <option value="auto">Tilfældigt ved besøg</option>
                {places.map((place) => (
                  <option key={place} value={place}>
                    {placeLabels[place]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="lc-another-scene"
              onClick={() => choosePlace(null)}
            >
              Se et andet sted <span aria-hidden="true">↻</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

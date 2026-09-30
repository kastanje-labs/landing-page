import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, Plus, X } from "./PixelIcon";
import { ChestnutMark } from "./Chestnut";
import { ThemeToggle, useAppUrl } from "./Theme";
import { OriginNote } from "./ui";
import { PILOT_CASHBACK_PERCENT } from "../shared";
import { LandingProduct } from "./LandingProduct";
import { ProjectLogos } from "./ProjectLogos";
import { ManifestArticle } from "./ManifestArticle";
import { LandingLandscape } from "./LandingLandscape";
import {
  landscapeScene,
  sceneInDenmark,
  scenePreviewOptions,
  landingPreviewEnabled,
  type LandscapeScene,
} from "../landing-scenes";
import "../landing-concepts.css";
import "../landing-daylight.css";
import "../landing-video-studies.css";

const daylightContent = {
  eyebrow: "AI-infrastruktur · Inference i EU",
  title: ["Små begyndelser.", "Store idéer."],
  description:
    "Flere AI-modeller. En API. Vælg den model, der passer til din opgave, og byg videre med Kastanje.",
  caption: "",
} as const;

const concepts = {
  danmark: {
    ...daylightContent,
    letter: "",
    name: "AI-infrastruktur",
    alt: "En dag i Danmark med Kastanje.",
  },
  landsbyen: {
    ...daylightContent,
    letter: "A",
    name: "Landsbyen",
    alt: "En malet dansk landsbygade med gule huse, røde tegltage, stokroser og en cykel. Pixelkastanjen sidder på en stentrappe under en stor blå sommerhimmel.",
  },
  kolonihaven: {
    ...daylightContent,
    letter: "B",
    name: "Kolonihaven",
    alt: "En frodig dansk kolonihave med et grønt træhus, hvid låge, køkkenhave og blomstrende træer. Pixelkastanjen sidder på en lågestolpe i sollyset.",
  },
  landevejen: {
    ...daylightContent,
    letter: "C",
    name: "Landevejen",
    alt: "En snoet markvej mellem gyldne kornmarker, læhegn og hvide gårde med røde tage. Pixelkastanjen sidder på en hegnspæl under store lyse sommerskyer.",
  },
  sommer: {
    ...daylightContent,
    letter: "D",
    name: "Dagslys",
    alt: "En malet dansk sommerdag ved en fjord. Store hvide skyer over blå himmel, grønne bredder og røde tegltage. Kastanjes orange pixelfigur sidder på en træbro under kastanjeblade.",
  },
  kysten: {
    letter: "A",
    name: "Kysten",
    eyebrow: "AI-infrastruktur · Inference i EU",
    title: ["Små begyndelser.", "Store idéer."],
    description:
      "Adgang til flere AI-modeller gennem en API. Vælg den, der passer til din opgave, og følg dit forbrug hos Kastanje.",
    caption: "Fra første idé til det, der kommer efter.",
    alt: "En stor orange pixelkastanje svæver over en klitsti. Marehalm, hav og et lille fyrtårn i den danske blå time.",
  },
  markerne: {
    letter: "B",
    name: "Markerne",
    eyebrow: "AI-infrastruktur · Inference i EU",
    title: ["Giv dine idéer", "plads til mere."],
    description:
      "Sammenlign AI-modeller, forbind dine værktøjer og byg videre. Kastanje samler modeladgang og forbrug et sted.",
    caption: "Et lille udgangspunkt. Plads til at vokse.",
    alt: "Kastanjes orange pixelkastanje lyser over en markvej mellem lave kornmarker, læhegn og et dansk teglstenshus.",
  },
  havnen: {
    letter: "C",
    name: "Havnen",
    eyebrow: "AI-infrastruktur · Inference i EU",
    title: ["Mange modeller.", "En forbindelse."],
    description:
      "Brug AI i det, du bygger. Med Kastanje får du en API til flere modeller og overblik over, hvad de koster at bruge.",
    caption: "Herfra går forbindelserne videre.",
    alt: "En orange kastanje bygget af pixels over en brostensbelagt kaj med en rolig fjord og lune vinduer i danske pakhuse.",
  },
} as const;

type Concept = keyof typeof concepts;

export function landingConceptFromUrl(): Concept | null {
  const value = new URLSearchParams(location.search).get("forside");
  if (
    value === "danmark" ||
    value === "landsbyen" ||
    value === "kolonihaven" ||
    value === "landevejen" ||
    value === "sommer" ||
    value === "kysten" ||
    value === "markerne" ||
    value === "havnen"
  )
    return value;
  // Keep previously shared preview links useful after the design revision.
  if (value === "froe") return "kysten";
  if (value === "stroem") return "markerne";
  if (value === "roedder") return "havnen";
  return null;
}

export function LandingConcept({
  concept,
  page = "home",
}: {
  concept: Concept;
  page?: "home" | "manifest";
}) {
  const isManifest = page === "manifest";
  const appUrl = useAppUrl();
  const preview = landingPreviewEnabled(location.hostname, location.search);
  const showVariations =
    preview && new URLSearchParams(location.search).get("variations") === "1";
  const direction = concepts[concept];
  const daylight = [
    "danmark",
    "sommer",
    "landsbyen",
    "kolonihaven",
    "landevejen",
  ].includes(concept);
  const rotating = concept === "danmark";
  const [layout, setLayout] = useState(() => {
    const requested = new URLSearchParams(location.search).get("layout");
    return preview && (requested === "b" || requested === "c")
      ? requested
      : "a";
  });
  const [currentScene, setCurrentScene] = useState<LandscapeScene>(() =>
    landscapeScene(
      sceneInDenmark(new Date()),
      scenePreviewOptions(location.hostname, location.search).place ??
        "landsbyen",
    ),
  );
  const variations: Concept[] = daylight
    ? ["landsbyen", "kolonihaven", "landevejen"]
    : ["kysten", "markerne", "havnen"];
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const hero = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousLang = document.documentElement.lang;
    const previousTitle = document.title;
    document.documentElement.lang = "da";
    document.title = isManifest
      ? "Kastanjes manifest — Plads til at bygge"
      : rotating
        ? "Kastanje — AI-infrastruktur"
        : `Kastanje — ${direction.name} · AI-infrastruktur`;
    return () => {
      document.documentElement.lang = previousLang;
      document.title = previousTitle;
    };
  }, [direction.name, rotating, isManifest]);

  // A link from /manifest can arrive before React has rendered its anchor.
  useEffect(() => {
    let frame = 0;
    const align = () => {
      frame = requestAnimationFrame(() => {
        try {
          const id = decodeURIComponent(location.hash.slice(1));
          if (id)
            document
              .getElementById(id)
              ?.scrollIntoView({ behavior: "instant" });
        } catch {
          // An invalid fragment should not prevent the page from opening.
        }
      });
    };
    if (document.readyState === "complete") align();
    else window.addEventListener("load", align, { once: true });
    return () => {
      window.removeEventListener("load", align);
      cancelAnimationFrame(frame);
    };
  }, [isManifest]);

  useEffect(() => {
    if (!hero.current) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(hero.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);

  return (
    <div
      className={`lc${isManifest ? " lc--manifest-page" : ""} lc--${concept}${daylight ? " lc--daylight" : ""}${rotating ? ` lc-video-study lc-video-study--${layout}${showVariations ? " is-study" : ""}` : ""}`}
      data-time={rotating ? currentScene.part : undefined}
    >
      <svg className="lc-color-defs" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id="lc-village-blue-hour" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.55 0 0 0 0  0 0.58 0 0 0  0 0 0.86 0 0.01  0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>
      <a className="lc-skip" href="#lc-main">
        Gå til indhold
      </a>
      <header className="lc-header">
        <a
          className="lc-brand"
          href={rotating ? "/" : `?forside=${concept}`}
          aria-label="Kastanje, forsiden"
        >
          <ChestnutMark size={33} />
          <span>kastanje</span>
        </a>
        <nav
          id="lc-navigation"
          className={menuOpen ? "is-open" : ""}
          aria-label="Hovedmenu"
        >
          <a
            href={isManifest ? "/#produkt" : "#produkt"}
            onClick={() => setMenuOpen(false)}
          >
            Produktet
          </a>
          <a href={appUrl("/app/compare")}>Modeller</a>
          <a
            href="/manifest"
            aria-current={isManifest ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            Vores manifest
          </a>
        </nav>
        <div className="lc-header-actions">
          <a className="lc-header-cta" href={appUrl()}>
            Åbn appen <ArrowUpRight size={15} />
          </a>
        </div>
        <button
          ref={menuButton}
          className="lc-menu"
          type="button"
          aria-controls="lc-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Luk menu" : "Åbn menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {rotating && <ThemeToggle language="da" />}
      </header>

      <main id="lc-main">
        {isManifest ? (
          <ManifestArticle />
        ) : (
          <>
            <section
              ref={hero}
              className={`lc-hero${paused || !visible ? " is-paused" : ""}`}
              aria-labelledby="lc-title"
            >
              {rotating ? (
                <LandingLandscape
                  visible={visible}
                  onSceneChange={setCurrentScene}
                />
              ) : (
                <div className="lc-art">
                  <img
                    src={`/landing/${concept}.jpg`}
                    alt={direction.alt}
                    width="1672"
                    height="941"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              )}
              <div className="lc-hero-shade" aria-hidden="true" />
              <div className="lc-hero-copy">
                <p className="lc-eyebrow">
                  <span aria-hidden="true" />
                  {direction.eyebrow}
                </p>
                <h1 id="lc-title">
                  {direction.title[0]}
                  <br />
                  <em>{direction.title[1]}</em>
                </h1>
                <p className="lc-intro">
                  {rotating
                    ? "AI-modeller til dine apps og værktøjer. Saml adgang, sammenlign priser og følg dit forbrug — med en API og inference i EU."
                    : direction.description}
                </p>
                <div className="lc-actions">
                  <a className="lc-button" href={appUrl()}>
                    Udforsk Kastanje <ArrowRight size={17} />
                  </a>
                  {(rotating || !daylight) && (
                    <a
                      className="lc-text-link"
                      href={rotating ? appUrl("/app/compare") : "#produkt"}
                    >
                      {rotating ? "Se modellerne" : "Se produktet"}{" "}
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </div>
              {!rotating && (
                <div className="lc-hero-foot">
                  <span>{direction.caption}</span>
                  <button
                    type="button"
                    className="lc-motion"
                    aria-pressed={paused}
                    aria-label={
                      paused
                        ? "Start baggrundsbevægelse"
                        : "Sæt baggrundsbevægelse på pause"
                    }
                    onClick={() => setPaused(!paused)}
                  >
                    <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
                    <span>{paused ? "Afspil" : "Pause"}</span>
                  </button>
                </div>
              )}
            </section>

            <div className="lc-strip" aria-label="Produktets grundlag">
              <span>Flere modeller. En API.</span>
              <span>Inference i EU</span>
              <span>Betal for dit forbrug</span>
            </div>

            {rotating && <ProjectLogos />}

            {rotating && (
              <section
                className="lc-reasons lc-wrap"
                aria-labelledby="lc-reasons-title"
              >
                <div>
                  <p className="lc-eyebrow">Derfor Kastanje</p>
                  <h2 id="lc-reasons-title">
                    Mere overblik.
                    <br />
                    Færre mellemregninger.
                  </h2>
                </div>
                <dl>
                  <div>
                    <dt>Modelvalg på dine vilkår</dt>
                    <dd>
                      Sammenlign kvalitet og pris på tværs af modeller. Skift,
                      når en anden passer bedre til opgaven.
                    </dd>
                  </div>
                  <div>
                    <dt>EU-ruten er en del af prisen</dt>
                    <dd>
                      Se priser for den modeladgang, du faktisk kan bruge i EU.
                      Samlet i samme overblik.
                    </dd>
                  </div>
                  <div>
                    <dt>Indhold og forbrug adskilt</dt>
                    <dd>
                      Kastanje gemmer forbrugsdata til afregning, ikke indholdet
                      af dine prompts og svar. Leverandørens vilkår gælder
                      særskilt.
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            {concept === "havnen" ? (
              <>
                <Manifest />
                <LandingProduct />
              </>
            ) : (
              <>
                <LandingProduct />
                <Manifest />
              </>
            )}

            <section
              className="lc-value lc-wrap"
              aria-labelledby="lc-value-title"
            >
              <div
                className="lc-value-number"
                aria-label={`${PILOT_CASHBACK_PERCENT} procent cashback`}
              >
                {PILOT_CASHBACK_PERCENT}
                <span>%</span>
                <span className="lc-value-return" aria-hidden="true">
                  ↗ cashback
                </span>
              </div>
              <div>
                <p className="lc-eyebrow">Lidt tilbage. Mere at bygge med.</p>
                <h2 id="lc-value-title">
                  Altid mindst {PILOT_CASHBACK_PERCENT} % tilbage.
                </h2>
                <p>
                  Du får altid mindst {PILOT_CASHBACK_PERCENT} % cashback på
                  betalt inference hos Kastanje. Beløbet kommer tilbage som
                  bonuscredits, du kan bruge til dine næste forespørgsler.
                </p>
                <a className="lc-text-link" href="#sporgsmal">
                  Sådan fungerer cashback <ArrowRight size={16} />
                </a>
              </div>
            </section>

            <section
              className="lc-faq lc-wrap"
              id="sporgsmal"
              aria-labelledby="lc-faq-title"
            >
              <h2 id="lc-faq-title">Godt at vide.</h2>
              <div className="lc-questions">
                <Question title="Hvad er AI-inference?">
                  Når en AI-model løser en opgave — for eksempel skriver et
                  svar, analyserer en tekst eller hjælper med kode — kaldes det
                  inference. Kastanje forbinder dine værktøjer med modellerne og
                  holder styr på forbruget.
                </Question>
                <Question title="Hvad betyder EU-inference?">
                  Det betyder, at selve modellen behandler forespørgslen i EU på
                  den valgte rute. Hvor data logges og opbevares, er et særskilt
                  forhold, som afhænger af leverandøren og aftalen. EU-inference
                  er derfor ikke i sig selv et løfte om, at ingen data gemmes.
                </Question>
                <Question title="Hvad får jeg tilbage som cashback?">
                  Du får mindst {PILOT_CASHBACK_PERCENT} % af dit betalte
                  inferenceforbrug tilbage som bonuscredits. De kan bruges til
                  mere inference hos Kastanje og kan ikke hæves som penge.
                  Bonusforbrug og eksterne abonnementer giver ikke ny cashback.
                </Question>
                <Question title="Kan jeg begynde at bruge Kastanje nu?">
                  Du kan gå på opdagelse i appen. Kastanje er i en tidlig pilot,
                  og adgang til rigtig inference aktiveres særskilt.
                  Betalingsflowet bruger indtil videre Stripe i testtilstand.
                </Question>
              </div>
            </section>

            {!rotating && (
              <section className="lc-closing">
                <ChestnutMark size={57} />
                <h2>Hvad vil du bygge?</h2>
                <a className="lc-button" href={appUrl()}>
                  Gå på opdagelse <ArrowRight size={17} />
                </a>
              </section>
            )}
          </>
        )}
      </main>

      {rotating ? (
        <footer className="lc-landscape-footer" id="kontakt">
          <img
            className="lc-footer-landscape"
            data-scene-id={currentScene.id}
            src={`/landing/${currentScene.id}.jpg`}
            alt=""
            loading="lazy"
            aria-hidden="true"
          />
          <div className="lc-footer-content">
            <h2>Hvad vil du bygge?</h2>
            <a className="lc-button" href={appUrl()}>
              Udforsk Kastanje <ArrowRight size={17} />
            </a>
            <div className="lc-footer-links">
              <a
                className="lc-brand"
                href={isManifest ? "/" : "#"}
                aria-label="Kastanje · til toppen"
              >
                <ChestnutMark size={30} />
                <span>kastanje</span>
              </a>
              <nav aria-label="Footer">
                <a href={isManifest ? "/#produkt" : "#produkt"}>Produktet</a>
                <a href={appUrl("/app/compare")}>Modeller</a>
                <a href="/manifest">Vores manifest</a>
                <a href="https://github.com/kastanje-labs">
                  GitHub <ArrowUpRight size={14} />
                </a>
                <a href="https://github.com/kastanje-labs/vscode-extension">
                  VS Code-udvidelse <ArrowUpRight size={14} />
                </a>
                <a href={isManifest ? "/#sporgsmal" : "#sporgsmal"}>
                  Spørgsmål
                </a>
              </nav>
            </div>
            <div className="lc-footer-meta">
              <OriginNote />
              <span>© {new Date().getFullYear()} Kastanje</span>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="lc-footer">
          <a className="lc-brand" href={rotating ? "/" : `?forside=${concept}`}>
            <ChestnutMark size={25} />
            <span>kastanje</span>
          </a>
          <p>AI-infrastruktur med plads til at vokse.</p>
          <a href="/manifest">
            Vores manifest <ArrowUpRight size={14} />
          </a>
        </footer>
      )}

      {rotating && showVariations ? (
        <nav className="lc-video-variations" aria-label="Vælg hero-variation">
          <span>Hero</span>
          {[
            ["a", "Landskab"],
            ["b", "Panorama"],
            ["c", "Side om side"],
          ].map(([key, label]) => {
            const query = new URLSearchParams(location.search);
            query.set("layout", key);
            return (
              <a
                key={key}
                href={`?${query}`}
                aria-current={layout === key ? "page" : undefined}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  history.replaceState(null, "", `?${query}`);
                  setLayout(key);
                }}
              >
                <b>{key.toUpperCase()}</b> {label}
              </a>
            );
          })}
        </nav>
      ) : rotating ? null : concept === "sommer" ? (
        <nav className="lc-study-note" aria-label="Designudkast">
          <span>Dagslys · nyt udkast</span>
          <a href="?forside=landsbyen">
            Se de nye forslag <ArrowUpRight size={13} />
          </a>
        </nav>
      ) : (
        <nav
          className={`lc-variations${daylight ? " lc-variations--daylight" : ""}`}
          aria-label="Vælg designforslag"
        >
          <span className="lc-variations-label">Forslag</span>
          {variations.map((key) => (
            <a
              key={key}
              href={`?forside=${key}`}
              aria-current={key === concept ? "page" : undefined}
            >
              <span>{concepts[key].letter}</span>
              {concepts[key].name}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

function Manifest() {
  return (
    <section
      className="lc-manifest"
      id="manifest"
      aria-labelledby="lc-manifest-title"
    >
      <div className="lc-manifest-aside">
        <ChestnutMark size={48} />
        <p className="lc-eyebrow">
          Kastanjes manifest
          <br />
          01 — Det, vi tror på
        </p>
      </div>
      <div className="lc-manifest-copy">
        <h2 id="lc-manifest-title">
          Gode idéer skal have
          <br />
          <em>plads til at vokse.</em>
        </h2>
        <p>
          Du skal kunne vælge en AI-model, fordi den passer til din opgave.
          Forstå, hvad du betaler for. Og vide, hvor din forespørgsel bliver
          behandlet.
        </p>
        <p>Det er det fundament, vi bygger Kastanje på.</p>
        <a className="lc-text-link lc-manifest-link" href="/manifest">
          Læs vores manifest <ArrowUpRight size={17} />
        </a>
      </div>
    </section>
  );
}

function Question({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details>
      <summary>
        {title}
        <Plus size={17} />
      </summary>
      <p>{children}</p>
    </details>
  );
}

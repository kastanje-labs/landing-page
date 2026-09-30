import { ChestnutMark } from "./Chestnut";
import { ArrowRight } from "./PixelIcon";
import { useAppUrl } from "./Theme";
import { OriginNote } from "./ui";
import { PILOT_CASHBACK_PERCENT } from "../shared";

export function ManifestArticle() {
  const appUrl = useAppUrl();
  return (
    <article className="manifest-article">
      <header className="manifest-intro">
        <p className="lc-eyebrow">Kastanjes manifest</p>
        <h1>
          Gode idéer skal have
          <br />
          <em>plads til at vokse.</em>
        </h1>
        <p>
          Det skal være lettere at bygge med AI. At vælge en model, forstå
          prisen og vide, hvor arbejdet bliver gjort.
        </p>
        <OriginNote />
      </header>
      <div className="manifest-body">
        <p>
          Vi bygger Kastanje til dem, der har noget, de gerne vil skabe. En
          lille app. Et værktøj til kollegerne. En virksomhed, der begynder med
          en idé ved køkkenbordet.
        </p>
        <p>
          AI kan hjælpe. Men først skal du finde rundt i modeller, abonnementer,
          priser og leverandører. Det tager tid fra det, du egentlig ville
          bygge. Kastanje samler den del af arbejdet.
        </p>
        <section>
          <span>01</span>
          <div>
            <h2>Opgaven kommer først.</h2>
            <p>
              Den nyeste model er ikke altid den rette. Nogle opgaver kræver
              stor præcision. Andre skal løses hurtigt og billigt. Du skal kunne
              sammenligne mulighederne og skifte, når dine behov ændrer sig.
            </p>
            <p>
              Derfor vil vi vise kvalitet, hastighed og pris sammen. Og gøre det
              klart, hvad tallene bygger på.
            </p>
          </div>
        </section>
        <section>
          <span>02</span>
          <div>
            <h2>Du skal kende forbindelsen.</h2>
            <p>
              Kastanje begynder med inference i EU. Den pris, du ser, skal gælde
              den modeladgang, du faktisk kan bruge her.
            </p>
            <p>
              Behandling, opbevaring og leverandørens ejerskab er forskellige
              ting. Vi vil være konkrete om hver af dem. Når noget endnu ikke er
              afklaret, skal det også fremgå.
            </p>
          </div>
        </section>
        <section>
          <span>03</span>
          <div>
            <h2>Godt indkøb skal komme dig til gode.</h2>
            <p>
              Vi arbejder med leverandører, kapacitet og priser, så du kan bruge
              modellerne gennem en forbindelse. Vi tjener penge på den
              infrastruktur og service, vi leverer.
            </p>
            <p>
              En del af værdien går tilbage til dig. Du får mindst{" "}
              {PILOT_CASHBACK_PERCENT} % af dit betalte inferenceforbrug tilbage
              som bonuscredits til mere inference. Bonusforbrug og eksterne
              abonnementer giver ikke ny cashback.
            </p>
          </div>
        </section>
        <section>
          <span>04</span>
          <div>
            <h2>Vi bygger herfra.</h2>
            <p>
              Kastanje er bygget i Danmark. Vi kan godt lide ting, der er til at
              forstå, virker i hverdagen og holder, når man bruger dem.
            </p>
            <p>
              Vi starter med eksisterende modeller og leverandører. Egen
              kapacitet og tilpassede modeller kan komme senere, når de gør en
              reel forskel for dem, der bygger med os.
            </p>
          </div>
        </section>
        <div className="manifest-signoff">
          <ChestnutMark size={48} />
          <p>
            Småt fra begyndelsen.
            <br />
            Med plads til mere.
          </p>
          <span>kastanje</span>
        </div>
        <a className="lc-text-link" href={appUrl()}>
          Se, hvad vi bygger <ArrowRight size={17} />
        </a>
      </div>
    </article>
  );
}

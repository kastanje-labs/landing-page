import { useVisibleMotion } from "./LandingProductGraphic";

const projects = [
  { name: "CryptoClub", id: "cryptoclub", href: "https://home.cryptoclub.dk" },
  { name: "Arc’IT AI", id: "arcitai", href: "https://arcitai.com/" },
  {
    name: "onlinesourdough",
    id: "onlinesourdough",
    href: "https://onlinesourdough.com/",
  },
];

export function ProjectLogos() {
  const motion = useVisibleMotion();
  return (
    <div
      className="lc-logo-strip lc-wrap"
      ref={motion.host}
      data-running={motion.running}
      data-reduced={motion.reduced}
    >
      <div className="lc-logo-heading">
        <p>Bygget med erfaring fra</p>
      </div>
      <div className="lc-logo-window">
        <div className="lc-logo-track">
          {[false, true].map((duplicate) => (
            <div
              key={String(duplicate)}
              className="lc-logo-group"
              aria-hidden={duplicate || undefined}
            >
              {projects.map((project) => (
                <a
                  key={project.id}
                  className={`lc-project-logo lc-project-logo--${project.id}`}
                  href={project.href}
                  tabIndex={duplicate ? -1 : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {project.id === "cryptoclub" ? (
                    <img
                      className="lc-project-cryptoclub"
                      src="/landing/brands/cryptoclub.png"
                      alt=""
                      width="38"
                      height="38"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="lc-project-mark"
                      aria-hidden="true"
                      style={{
                        maskImage: `url(/landing/brands/${project.id}.svg)`,
                        WebkitMaskImage: `url(/landing/brands/${project.id}.svg)`,
                      }}
                    />
                  )}
                  <span>{project.name}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

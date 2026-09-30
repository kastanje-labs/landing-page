# Kastanje website

The public landing page and manifest for Kastanje. Its landscape, themes and pixel
chestnut are shared with the separately maintained platform and editor extension.

## Source boundaries

- Website: this public repository, `kastanje-labs/landing-page`.
- VS Code: the public `kastanje-labs/vscode-extension` repository.
- Platform: a separate private repository. Accounts, login, projects, inference and
  payments run there. This website has no newsletter, sign-in form, database or API.

“Åbn appen” opens `https://kastanje-app-demo.gustavonline.workers.dev/app`.
Legacy `/app`, `/onboarding` and `/connect` links redirect to that platform.

## Develop and check

```sh
npm ci
npm run ci
npm run dev
```

The build is standalone. `VITE_APP_ORIGIN` changes the app link at build time;
`APP_ORIGIN` in the Worker controls legacy redirects. Keep both aligned.
Scene, theme, redirect/denial tests and public-build checks run in CI.

[Hosting and domain](docs/hosting.md) · [Proof and recovery](docs/proof.md) ·
[Source provenance](docs/provenance.json)

MIT for source. Geist fonts retain their SIL Open Font License in `public/fonts`.
Kastanje branding and illustrations originate from Gustav's existing public website.

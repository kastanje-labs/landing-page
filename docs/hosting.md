# Hosting, domain and recovery

The website uses the existing Cloudflare Worker **kastanje-demo**, in the same
account as the app Worker. Its current public URL remains
https://kastanje-demo.gustavonline.workers.dev/ . No additional paid service or
database is needed. The app Worker is maintained by the private platform repository.

## Publish

Run `npm ci && npm run ci`, review the public files, then `npm run deploy` under
the existing operator login. Read back the deployed version and exercise `/`,
`/manifest`, app redirects, API denial and desktop/mobile theme behavior.
Ordinary Git pushes only run CI; deployment uses the separately authenticated operator.

## Connect kastanje.ai after purchase

1. Buy **kastanje.ai**, add it as a Cloudflare zone in the existing account and
   activate its nameservers. Ownership and activation are prerequisites.
2. In Cloudflare → Workers & Pages → **kastanje-demo** → Settings → Domains & Routes
   → Add → Custom Domain, add `kastanje.ai` and optionally `www.kastanje.ai`.
   Cloudflare manages the DNS records and certificates for these Worker domains.
3. Verify HTTPS, `/manifest`, assets and the app CTA on the new address. The app
   keeps its existing URL; no auth or cookie migration is required for the website.
4. Keep the workers.dev address available until the new domain has been verified.

The active config intentionally has no route to an unowned domain. The Worker and
build are ready for the custom-domain step. No domain purchase or DNS change is
part of this extraction. See Cloudflare's custom-domain documentation:
https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

## Roll back

Use `wrangler rollback PREVIOUS_VERSION --config cloudflare/wrangler.jsonc`.
Retain the reviewed source SHA and deployed version in docs/proof.md. Website
rollback does not modify platform Durable Objects, account data or credentials.

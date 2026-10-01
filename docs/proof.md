# Verification and recovery

## Accepted and deployed — 2026-09-30

The public website was extracted to fresh public history, independently reviewed,
merged and deployed. Source: `758147ec2935498209d4b148f28646793a33adf2`.
Live URL: https://kastanje-demo.gustavonline.workers.dev/ .
Cloudflare Worker: `kastanje-demo`; active version at release:
`25a3c1a5-2284-4bbb-a8d6-33ff1eb0bfde` (100%).
Previous confirmed version: `9a48b41f-f89f-4658-881d-86c1a311f431`.

- Node.js 22.21.1, npm 11.14.1; `npm ci && npm run ci` passed TypeScript,
  17 tests, production build, public boundary check and actual local Cloudflare
  Worker integration.
- The default asset HTML handling initially redirected `/index.html` back to
  `/`, creating a loop through the Worker. `html_handling: none` corrected it.
  The real Worker integration gate covers root/manifest/assets/HEAD, fixed app
  redirect, unknown routes, API denial and POST denial.
- Live readback: `/` and `/manifest` return 200; `/app` returns the bounded 302
  redirect to the separate platform; API/v1/MCP/unknown paths return 404;
  POST returns 405. Reviewed public assets matched the deployed build.
- Browser inspection covered desktop and 390 px mobile, light/dark themes,
  manifest, footer links and app CTA, without observed console errors.
- Public source/build screening and independent review checked the landing
  import graph, assets and source history. This is scoped evidence, not an
  exhaustive security review. The public website owns no account, auth,
  billing, inference, newsletter form or write API.

## Delivery audit — 2026-10-01

The independent audit found no unintended code/asset loss. Of the original
public assets, 47 are byte-identical; `robots.txt` was deliberately adapted for
standalone ownership. The provenance mapping explains the small reductions in
shared helpers. The public repository has no private-platform commit ancestry.
The delivered runtime has not changed in this documentation correction.
GitHub CI run `36723100110` passed for the delivered main revision.

The domain `kastanje.ai` has not been bought or attached. The existing Worker is
ready for a custom domain after purchase and Cloudflare zone activation; see
[hosting](hosting.md). No new hosting service or account migration was created.

## Recovery

Keep the previous confirmed Worker version and reviewed source. Use the rollback
command in [hosting and recovery](hosting.md) if needed. Production rollback has
not been exercised. Website rollback does not modify platform account data,
Durable Objects or credentials. For source reversal use `git revert`, then run
the same verification before any separately authorized redeployment.

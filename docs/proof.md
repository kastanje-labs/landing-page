# Verification and recovery

## Local candidate — 2026-09-30

This records local preparation evidence. The caller owns the separate review and
acceptance. No GitHub, account or live deployment action was performed, so there
is no deployed version or live-site verification to report.

- Runtime: Node.js 22.21.1 and npm 11.14.1.
- `npm install` generated `package-lock.json`; npm reported zero vulnerabilities.
- `npm ci && npm run ci` passed: TypeScript check, 17 tests, production build and
  public boundary check.
- The public checker traced 26 site source modules, one Worker module and 7
  entry-reachable build files; compared 48 public assets byte-for-byte; and scanned
  built text and Worker source for common credential patterns. It is a scoped
  check, not an exhaustive security review.
- Local browser inspection covered desktop and 390 px mobile layouts in light and
  dark themes. The page used local assets, showed the expected footer links and
  reported no browser console errors.
- `npx wrangler deploy --config cloudflare/wrangler.jsonc --dry-run` passed with
  Wrangler 4.144.0. It read 55 built assets and resolved the configured bindings;
  dry-run exited without deploying.

## Recovery

This candidate has not changed the live Worker. If a later, separately authorized
deployment is made, record its source commit and deployed version here. Retain the
previous confirmed Worker version and use the rollback command in
[hosting and recovery](hosting.md) if recovery is needed. For a local source
reversal, use `git revert` on the candidate commit before preparing another
deployment.

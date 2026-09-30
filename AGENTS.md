# Kastanje landing page

This public repository owns only the website, manifest, reviewed graphics and fonts.
Read README.md and docs/hosting.md. Preserve the landscape design, Copenhagen scenes,
themes, responsive behavior and accessibility. Use the shared Factory method for
implementation and separate review. One writer per checkout.

Run npm ci && npm run ci. Review the import graph and public build before publishing.
Never import platform account UI, authentication, billing, inference, private research,
operator state or credentials. The app CTA links to the separately configured platform.
The Worker serves read-only assets and bounded redirects, with no form or API writes.
Keep public repository/deployment proof and recovery in docs/proof.md.

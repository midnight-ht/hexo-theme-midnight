# Topic collections

A collection path under `/categories/` selects posts by their Hexo categories. A path under `/tags/` selects posts by tags. Both array and Hexo collection taxonomy values are supported. Configure the collection name to match the taxonomy name exactly.

Use categories for lifecycle navigation when descriptive article tags vary. Existing tag collection URLs continue to work. The homepage links to the localized collection only when at least one post belongs to that taxonomy; a matching tag does not populate a category collection.

Run `npm run lint:home` for category, tag, localization and empty-topic regression coverage.

Category links from the unprefixed root homepage also resolve to the configured default-language route. The category index and canonical-name category paths follow the same rule as aliased category names.

Article bodies use scoped Cloudflare `email_off` comments outside the content container so that code literals remain readable without JavaScript and match the authored example. This does not change zone-wide obfuscation or unrelated contact addresses. See https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/. Local rendering checks the markers; public response parity must confirm the actual edge behavior.

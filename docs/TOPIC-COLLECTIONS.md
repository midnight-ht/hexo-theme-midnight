# Topic collections

A collection path under `/categories/` selects posts by their Hexo categories. A path under `/tags/` selects posts by tags. Both array and Hexo collection taxonomy values are supported. Configure the collection name to match the taxonomy name exactly.

Use categories for lifecycle navigation when descriptive article tags vary. Existing tag collection URLs continue to work. The homepage links to the localized collection only when at least one post belongs to that taxonomy; a matching tag does not populate a category collection.

Run `npm run lint:home` for category, tag, localization and empty-topic regression coverage.

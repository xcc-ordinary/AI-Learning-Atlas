# Releasing

1. Update the version in `package.json`, `manifest.json`, and `versions.json`.
2. Run `npm test`, `npm run build`, and `npm run check:release`.
3. Commit the changes and create a tag matching the manifest version.
4. Push the commit and tag. GitHub Actions publishes `main.js`, `manifest.json`, and `styles.css` as release assets.

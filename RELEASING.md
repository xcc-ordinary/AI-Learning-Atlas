# Releasing

1. Update the version in `package.json`, `manifest.json`, and `versions.json`.
2. Run `npm test`, `npm run build`, and `npm run check:release`.
3. Commit the changes and create a tag matching the manifest version.
4. Push the commit and tag. GitHub Actions publishes `main.js`, `manifest.json`, and `styles.css` as release assets.

BRAT treats GitHub Releases as the update source. Users who added the repository without freezing a version can then install the newest semantic version through BRAT. For preview builds, use a higher semantic version such as `1.5.0-beta.1`; the release workflow marks tags containing `-` as pre-releases.

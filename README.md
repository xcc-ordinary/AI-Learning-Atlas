# AI Learning Atlas

An Obsidian-native visual learning cockpit for completing Microsoft's [AI for Beginners](https://github.com/microsoft/AI-For-Beginners) curriculum.

## Features

- Visual overview, 12-week roadmap and 24-lesson progress tracking
- Expandable lesson directories generated from the real Markdown headings
- One-click navigation to an exact lesson section
- Side-by-side source lesson and concise personal notes
- Connected concept notes and a gradually illuminated knowledge graph
- Direct AI translation for selections or entire lessons
- DeepSeek, Kimi and OpenAI-compatible providers with Obsidian Secret Storage

## Install

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Create `<your-vault>/.obsidian/plugins/ai-learning-atlas/`.
3. Put the three files into that folder.
4. Restart Obsidian and enable **AI Learning Atlas** under Community plugins.

For the complete curriculum experience, clone AI for Beginners and open its repository root as an Obsidian vault.

```bash
git clone https://github.com/microsoft/AI-For-Beginners.git
```

## Development

```bash
npm install
npm test
npm run build
npm run check:release
```

## Privacy

AI translation is disabled by default. Only content you explicitly translate is sent to the provider you configure. API keys are stored through Obsidian Secret Storage.

## License

MIT

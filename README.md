# PR Extension

Adobe Premiere Pro CEP extension by itGenius. Three tabs:

- **ElevenLabs** — text-to-speech generation
- **HeyGen** — AI avatar video generation
- **Assets** — shared team asset library backed by Google Drive for Desktop

## For users

Install the **PR Extension Manager** (a small Windows desktop app) once. The Manager handles installing and updating the extension into Premiere Pro.

See [docs/installation.md](docs/installation.md) for the step-by-step.

## For maintainers

This repo has two release channels distinguished by tag prefix:

- `extension-vX.Y.Z` — releases of the CEP extension itself
- `manager-vX.Y.Z` — releases of the Tauri Manager app

See [docs/release-process.md](docs/release-process.md) for how to cut a release.

## Repository layout

```
extension/   the CEP extension (Vite + React + ExtendScript)
manager/     the Tauri desktop app (Rust + React)
docs/        installation + release guides
.github/     CI workflows
```

## License

MIT — see [LICENSE](LICENSE).

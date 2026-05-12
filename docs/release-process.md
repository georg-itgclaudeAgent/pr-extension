# Release Process

## Cutting an Extension release

1. From `pr-extension/extension/`, ensure `npm run build` succeeds locally.
2. Bump the `ExtensionBundleVersion` attribute in `extension/CSXS/manifest.xml` to the new version (e.g. `1.1.0`).
3. Commit: `chore(extension): bump to v1.1.0`.
4. Push.
5. Tag and push the tag:
   ```
   git tag extension-v1.1.0
   git push origin extension-v1.1.0
   ```
6. The `release-extension.yml` workflow runs automatically: builds the client, zips runtime files, creates a GitHub release with `pr-extension-1.1.0.zip` attached and auto-generated release notes.
7. Edit the release on GitHub to polish the notes if desired.

## Cutting a Manager release

1. From `pr-extension/manager/`, ensure `npm run tauri build` succeeds locally.
2. Bump `version` in `manager/src-tauri/tauri.conf.json` and `manager/package.json`.
3. Commit: `chore(manager): bump to v0.2.0`.
4. Push, tag `manager-v0.2.0`, push tag.
5. The `release-manager.yml` workflow runs: builds Tauri app on Windows, signs the updater payload with `TAURI_PRIVATE_KEY`, creates a GitHub release with the `.exe` + `latest.json` attached.

## One-time setup of the Tauri updater keys

1. Locally: `cargo install tauri-cli --version "^2.0"`.
2. `tauri signer generate -w ~/.tauri/pr-extension-manager.key` (save passphrase securely).
3. The public key (printed during generation) goes into `manager/src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
4. The private key (in the saved file) is base64-encoded and stored as the GitHub Actions secret `TAURI_PRIVATE_KEY` in the repo settings. The passphrase goes into `TAURI_KEY_PASSWORD`.

Done — CI can now sign releases.

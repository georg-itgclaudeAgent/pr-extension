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

Extension releases are created with `--latest=false`. **The `manager-v0.1.0` release must stay
marked Latest**: it bridges old "PR Extension Manager" installs to Genius Installer Manager
(see [genius-installer-manager/docs/release-process.md](https://github.com/georg-itgclaudeAgent/genius-installer-manager/blob/main/docs/release-process.md)).

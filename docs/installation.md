# Installing the PR Extension

## One-time setup

1. Download the latest **Genius Installer Manager** installer:
   - Go to https://github.com/georg-itgclaudeAgent/genius-installer-manager/releases/latest
   - Download `GeniusInstallerManager-Setup-X.Y.Z.exe`
2. Double-click the `.exe` to install. Windows SmartScreen may warn — click "More info" → "Run anyway" (the updater payload is signed but the binary itself is not code-signed; this is a known limitation).
3. Launch **Genius Installer Manager** from the Start menu.

Already have the old **PR Extension Manager**? It updates itself to Genius Installer Manager and removes the old copy. Nothing to do.

## Installing the PR Extension

1. Open the Manager.
2. You should see a card for "PR Extension" with an **Install** button.
3. Click **Install**. The Manager downloads the latest version from GitHub and copies it into Premiere's extensions folder.
4. Restart Premiere Pro if it's already open.
5. In Premiere: **Window → Extensions → PR extension**. The panel should appear.

## Updating

When a new version is released:

- The Manager will show an **Update available** card when you open it.
- Inside Premiere, the PR Extension panel will show a "New update available" overlay on its first load after the release.
- Click **Update** in the Manager. Restart Premiere if it's open.

## Uninstalling

In the Manager, click **Uninstall** on the PR Extension card. This removes the files from Premiere's extensions folder. The Manager itself stays installed; use Windows "Add or Remove Programs" to remove Genius Installer Manager.

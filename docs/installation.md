# Installing the PR Extension

## One-time setup

1. Download the latest **PR Extension Manager** installer:
   - Go to https://github.com/georg-itgclaudeAgent/pr-extension/releases
   - Find the latest release tagged `manager-vX.Y.Z`
   - Download `PRExtensionManager-Setup-X.Y.Z.exe`
2. Double-click the `.exe` to install. Windows SmartScreen may warn — click "More info" → "Run anyway" (the installer is signed but the binary itself is not code-signed; this is a known limitation).
3. Launch the **PR Extension Manager** from Start menu.

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

In the Manager, click **Uninstall** on the PR Extension card. This removes the files from Premiere's extensions folder. The Manager itself stays installed; use Windows "Add or Remove Programs" to remove the Manager.

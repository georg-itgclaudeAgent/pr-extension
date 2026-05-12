/* global CSInterface is loaded via <script> in index.html */
declare class CSInterface {
  evalScript(script: string, callback?: (result: string) => void): void;
  getSystemPath(pathType: string): string;
}

// Lazy-init: only available inside CEP (not in a regular browser).
let _cs: CSInterface | null = null;

function getCS(): CSInterface {
  if (!_cs) _cs = new (window as any).CSInterface();
  return _cs;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function evalScriptAsync(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    getCS().evalScript(script, (result: string) => {
      if (result && result.startsWith("Error:")) {
        reject(new Error(result.replace("Error: ", "")));
      } else {
        resolve(result);
      }
    });
  });
}

export async function getSelectedCaptionText(): Promise<string | null> {
  const result = await evalScriptAsync("getSelectedCaptionText()");
  if (!result || result === "EvalScript_Error") return null;
  return result;
}

export async function saveAudioFile(
  audioData: ArrayBuffer,
  directory: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `pr-extension-${timestamp}.mp3`;
  const base64 = arrayBufferToBase64(audioData);
  const escapedDir = directory.replace(/\\/g, "\\\\");
  // Pass base64 data to ExtendScript for file writing
  const result = await evalScriptAsync(
    'saveAudioFile("' + escapedDir + '", "' + filename + '", "' + base64 + '")'
  );
  if (result.startsWith("Error:")) {
    throw new Error(result);
  }
  return result; // returns the full file path
}

export async function importAndInsertAtPlayhead(
  filePath: string
): Promise<void> {
  const escaped = filePath.replace(/\\/g, "\\\\");
  const result = await evalScriptAsync(
    'importAndInsertAtPlayhead("' + escaped + '")'
  );
  if (result !== "OK") {
    throw new Error(result || "Failed to add audio to timeline.");
  }
}

export async function pickOutputDirectory(): Promise<{
  path: string;
  token: string;
} | null> {
  const result = await evalScriptAsync("pickOutputDirectory()");
  if (!result) return null;
  // CEP doesn't use persistent tokens — just return the path for both fields
  // to maintain interface compatibility with the Settings component
  return { path: result, token: result };
}

export async function saveVideoFile(
  videoData: ArrayBuffer,
  directory: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `pr-extension-${timestamp}.mp4`;
  const base64 = arrayBufferToBase64(videoData);
  const escapedDir = directory.replace(/\\/g, "\\\\");
  const result = await evalScriptAsync(
    'saveVideoFile("' + escapedDir + '", "' + filename + '", "' + base64 + '")'
  );
  if (result.startsWith("Error:")) {
    throw new Error(result);
  }
  return result;
}

export async function insertAssetAtPlayhead(
  filePath: string
): Promise<"inserted" | "bin-only"> {
  const escaped = filePath.replace(/\\/g, "\\\\");
  const result = await evalScriptAsync(
    'insertAssetAtPlayhead("' + escaped + '")'
  );
  if (result === "OK") return "inserted";
  if (result === "OK_BIN_ONLY") return "bin-only";
  throw new Error(result || "Failed to insert asset.");
}

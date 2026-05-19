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

function nodeRequire<T = any>(id: string): T {
  if (!(window as any).cep_node) {
    throw new Error("cep_node not available — extension must run inside CEP with --enable-nodejs");
  }
  return (window as any).cep_node.require(id);
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

/**
 * Write an ArrayBuffer directly to disk via cep_node's fs module — bypasses
 * ExtendScript's slow naive base64 decode that froze the panel for large
 * audio buffers.
 */
function writeBufferToFile(
  data: ArrayBuffer,
  directory: string,
  extension: string
): string {
  const fs = nodeRequire("fs");
  const path = nodeRequire("path");

  if (!directory) throw new Error("No output directory configured.");
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory does not exist: ${directory}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `pr-extension-${timestamp}${extension}`;
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, Buffer.from(data));
  return filePath;
}

export async function saveAudioFile(
  audioData: ArrayBuffer,
  directory: string
): Promise<string> {
  return writeBufferToFile(audioData, directory, ".mp3");
}

export async function saveVideoFile(
  videoData: ArrayBuffer,
  directory: string
): Promise<string> {
  return writeBufferToFile(videoData, directory, ".mp4");
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

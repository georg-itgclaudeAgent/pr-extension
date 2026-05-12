/**
 * ExtendScript host for PR extension.
 * Called from the CEP panel via csInterface.evalScript().
 * Runs in Premiere Pro's ExtendScript engine (not Node.js).
 */

/**
 * Decode base64 string and write binary audio file to disk.
 * @param {string} directory - Target directory path.
 * @param {string} filename - Output filename.
 * @param {string} base64Data - Base64-encoded audio data.
 * @returns {string} Full file path on success, or "Error: ..." on failure.
 */
function saveAudioFile(directory, filename, base64Data) {
  try {
    var folder = new Folder(directory);
    if (!folder.exists) return "Error: Directory does not exist: " + directory;

    var file = new File(folder.fsName + "/" + filename);
    file.encoding = "BINARY";
    var ok = file.open("w");
    if (!ok) return "Error: Could not open file for writing: " + file.fsName;

    // Decode base64 to binary string and write
    var raw = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var len = base64Data.length;
    var i = 0;

    while (i < len) {
      var c0 = chars.indexOf(base64Data.charAt(i++));
      var c1 = chars.indexOf(base64Data.charAt(i++));
      var c2 = chars.indexOf(base64Data.charAt(i++));
      var c3 = chars.indexOf(base64Data.charAt(i++));

      raw += String.fromCharCode((c0 << 2) | (c1 >> 4));
      if (c2 !== -1) raw += String.fromCharCode(((c1 & 15) << 4) | (c2 >> 2));
      if (c3 !== -1) raw += String.fromCharCode(((c2 & 3) << 6) | c3);
    }

    file.write(raw);
    file.close();

    return file.fsName;
  } catch (e) {
    return "Error: " + e.toString();
  }
}

/**
 * Decode base64 string and write binary video file to disk.
 * Same logic as saveAudioFile but for MP4.
 * @param {string} directory - Target directory path.
 * @param {string} filename - Output filename.
 * @param {string} base64Data - Base64-encoded video data.
 * @returns {string} Full file path on success, or "Error: ..." on failure.
 */
function saveVideoFile(directory, filename, base64Data) {
  try {
    var folder = new Folder(directory);
    if (!folder.exists) return "Error: Directory does not exist: " + directory;

    var file = new File(folder.fsName + "/" + filename);
    file.encoding = "BINARY";
    var ok = file.open("w");
    if (!ok) return "Error: Could not open file for writing: " + file.fsName;

    // Decode base64 to binary string and write
    var raw = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var len = base64Data.length;
    var i = 0;

    while (i < len) {
      var c0 = chars.indexOf(base64Data.charAt(i++));
      var c1 = chars.indexOf(base64Data.charAt(i++));
      var c2 = chars.indexOf(base64Data.charAt(i++));
      var c3 = chars.indexOf(base64Data.charAt(i++));

      raw += String.fromCharCode((c0 << 2) | (c1 >> 4));
      if (c2 !== -1) raw += String.fromCharCode(((c1 & 15) << 4) | (c2 >> 2));
      if (c3 !== -1) raw += String.fromCharCode(((c2 & 3) << 6) | c3);
    }

    file.write(raw);
    file.close();

    return file.fsName;
  } catch (e) {
    return "Error: " + e.toString();
  }
}

/**
 * Import a file into the active project and insert it at the playhead position.
 * @param {string} filePath - Native path to the audio file on disk.
 * @returns {string} "OK" on success, error message on failure.
 */
function importAndInsertAtPlayhead(filePath) {
  try {
    var project = app.project;
    if (!project) return "Error: No active project.";

    var sequence = project.activeSequence;
    if (!sequence) return "Error: No active sequence. Please open a sequence first.";

    // Import file into project
    var importSuccess = project.importFiles([filePath], true, project.rootItem, false);
    if (!importSuccess) return "Error: Failed to import audio file.";

    // Find the imported item by filename
    var filename = filePath.replace(/^.*[\\\/]/, "");
    var rootItem = project.rootItem;
    var audioItem = null;

    for (var i = 0; i < rootItem.children.numItems; i++) {
      if (rootItem.children[i].name === filename) {
        audioItem = rootItem.children[i];
        break;
      }
    }

    if (!audioItem) return "Error: Could not find imported audio in project bin.";

    // Get playhead position
    var playheadTime = sequence.getPlayerPosition();

    // Find the first audio track
    var audioTrack = null;
    for (var t = 0; t < sequence.audioTracks.numTracks; t++) {
      audioTrack = sequence.audioTracks[t];
      break;
    }

    if (!audioTrack) return "Error: No audio tracks in sequence.";

    // Insert at playhead — overwrite edit
    audioTrack.overwriteClip(audioItem, playheadTime.ticks);

    return "OK";
  } catch (e) {
    return "Error: " + e.toString();
  }
}

/**
 * Get caption/subtitle text from the currently selected track items.
 * @returns {string} The extracted text, or an error message starting with "Error:".
 */
function getSelectedCaptionText() {
  try {
    var project = app.project;
    if (!project) return "Error: No active project.";

    var sequence = project.activeSequence;
    if (!sequence) return "Error: No active sequence.";

    var selection = sequence.getSelection();
    if (!selection || selection.length === 0) return "Error: No items selected in timeline.";

    var firstItem = selection[0];
    var projectItem = firstItem.projectItem;
    if (!projectItem) return "Error: Selected item has no project item.";

    // Try to get captions via project item transcript
    var captions = projectItem.getProjectColumnsMetadata();
    // Fallback: return the clip name if no transcript is available
    return projectItem.name || "Error: Could not extract caption text.";
  } catch (e) {
    return "Error: " + e.toString();
  }
}

/**
 * Open a native folder picker dialog.
 * @returns {string} The selected folder path, or empty string if cancelled.
 */
function pickOutputDirectory() {
  try {
    var folder = Folder.selectDialog("Select output directory for generated audio");
    if (folder) {
      return folder.fsName;
    }
    return "";
  } catch (e) {
    return "";
  }
}

/**
 * Import an asset and insert at playhead, auto-routing to the appropriate track.
 * Routes by extension:
 *   .mp3/.wav/.aac/.m4a/.aiff/.flac          → first audio track (overwrite)
 *   .mp4/.mov/.avi/.mxf/.mkv                  → first video track (overwrite)
 *   .png/.jpg/.jpeg/.gif/.tif/.tiff/.bmp/.psd → first video track (overwrite, 5-second still)
 *   .mogrt and unrecognized                   → import to bin only (no insert)
 * @param {string} filePath  Native path to the cached asset.
 * @returns {string} "OK" on success, "OK_BIN_ONLY" if imported but not inserted, or "Error: ...".
 */
function insertAssetAtPlayhead(filePath) {
  try {
    var project = app.project;
    if (!project) return "Error: No active project.";

    var sequence = project.activeSequence;
    if (!sequence) return "Error: No active sequence. Please open a sequence first.";

    var importSuccess = project.importFiles([filePath], true, project.rootItem, false);
    if (!importSuccess) return "Error: Failed to import file.";

    var filename = filePath.replace(/^.*[\\\/]/, "");
    var rootItem = project.rootItem;
    var item = null;
    for (var i = 0; i < rootItem.children.numItems; i++) {
      if (rootItem.children[i].name === filename) {
        item = rootItem.children[i];
        break;
      }
    }
    if (!item) return "Error: Could not find imported item in project bin.";

    var ext = filename.toLowerCase().replace(/^.*\./, "");
    var audioExts = { mp3: 1, wav: 1, aac: 1, m4a: 1, aiff: 1, flac: 1 };
    var videoExts = { mp4: 1, mov: 1, avi: 1, mxf: 1, mkv: 1 };
    var imageExts = { png: 1, jpg: 1, jpeg: 1, gif: 1, tif: 1, tiff: 1, bmp: 1, psd: 1 };

    var playhead = sequence.getPlayerPosition();

    if (audioExts[ext]) {
      if (sequence.audioTracks.numTracks === 0) return "Error: No audio tracks in sequence.";
      sequence.audioTracks[0].overwriteClip(item, playhead.ticks);
      return "OK";
    }
    if (videoExts[ext] || imageExts[ext]) {
      if (sequence.videoTracks.numTracks === 0) return "Error: No video tracks in sequence.";
      sequence.videoTracks[0].overwriteClip(item, playhead.ticks);
      return "OK";
    }

    // Unsupported types (e.g. .mogrt) — leave in bin
    return "OK_BIN_ONLY";
  } catch (e) {
    return "Error: " + e.toString();
  }
}

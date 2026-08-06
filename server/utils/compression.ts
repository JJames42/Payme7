import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import crypto from 'crypto';
import sharp from 'sharp';
import { Attachment } from '../../src/types';

// Helper to run shell commands as promises
function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Helper to parse base64 Data URLs
function parseBase64(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches) {
    return {
      mimeType: matches[1].toLowerCase(),
      buffer: Buffer.from(matches[2], 'base64')
    };
  }
  return {
    mimeType: '',
    buffer: Buffer.from(dataUrl, 'base64')
  };
}

// Helper to convert Buffer to base64 Data URL
function toDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

// Create a unique temporary file path
function getTempFilePath(extension: string): string {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return path.join(os.tmpdir(), `upload-${uniqueId}${extension}`);
}

/**
 * Optimizes an image attachment.
 * - Converts to WebP.
 * - Resizes to max 1200px (without enlarging).
 * - Targets a final size of 50-90 KB.
 * - Preserves quality for readability.
 */
async function optimizeImage(buffer: Buffer, originalMime: string, filename: string): Promise<{ dataUrl: string; type: string; name: string }> {
  // If already below target size (90 KB), skip compression completely to avoid unnecessary processing
  if (buffer.length <= 90 * 1024) {
    return {
      dataUrl: toDataUrl(buffer, originalMime),
      type: originalMime,
      name: filename
    };
  }

  let sharpInstance = sharp(buffer);
  const metadata = await sharpInstance.metadata();

  if (!metadata.width || !metadata.height) {
    // Fallback if metadata cannot be read
    return {
      dataUrl: toDataUrl(buffer, originalMime),
      type: originalMime,
      name: filename
    };
  }

  // Do not enlarge small images. Resize down to max 1200px if larger.
  if (metadata.width > 1200 || metadata.height > 1200) {
    sharpInstance = sharpInstance.resize({
      width: 1200,
      height: 1200,
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Iteratively find quality that targets 50-90 KB. Stop at 60 to preserve readability.
  const qualities = [80, 70, 60];
  let compressedBuffer = buffer;

  for (const q of qualities) {
    const webpBuffer = await sharpInstance
      .clone()
      .webp({ quality: q, effort: 4 })
      .toBuffer();

    compressedBuffer = webpBuffer;
    
    // If output is within or below target range, stop
    if (webpBuffer.length <= 90 * 1024) {
      break;
    }
  }

  const outputName = `${path.parse(filename).name}.webp`;
  return {
    dataUrl: toDataUrl(compressedBuffer, 'image/webp'),
    type: 'image/webp',
    name: outputName
  };
}

/**
 * Optimizes a video attachment.
 * - Rejects if duration is > 2 minutes.
 * - Compresses to 480p (or lower if needed) with H.264 + AAC.
 * - Targets 5 MB or less.
 * - Rejects if size remains > 5 MB.
 */
async function optimizeVideo(buffer: Buffer, originalMime: string, filename: string): Promise<{ dataUrl: string; type: string; name: string; duration?: number }> {
  const ext = path.extname(filename) || '.mp4';
  const tempInput = getTempFilePath(ext);
  const tempOutput = getTempFilePath('.mp4');

  try {
    fs.writeFileSync(tempInput, buffer);

    // 1. Check duration with ffprobe
    const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempInput}"`;
    const { stdout: durationStr } = await execPromise(probeCmd);
    const duration = parseFloat(durationStr.trim());

    if (isNaN(duration)) {
      throw new Error('Could not parse video duration.');
    }

    if (duration > 120) {
      throw new Error('Video duration exceeds the maximum limit of 2 minutes.');
    }

    // If already below target size (5 MB), skip recompression completely
    if (buffer.length <= 5 * 1024 * 1024) {
      return {
        dataUrl: toDataUrl(buffer, originalMime),
        type: originalMime,
        name: filename,
        duration: Math.round(duration)
      };
    }

    // 2. Dynamic bitrate logic to target <= 5 MB
    // Target 4.5 MB to be safe
    const targetSizeBits = 4.5 * 1024 * 1024 * 8;
    const targetTotalBitrate = Math.floor(targetSizeBits / duration); // bits per second
    const audioBitrate = 64 * 1024; // 64kbps
    let videoBitrate = targetTotalBitrate - audioBitrate;

    // Constrain video bitrate to a reasonable range
    videoBitrate = Math.max(100 * 1024, Math.min(1200 * 1024, videoBitrate));

    // Determine target resolution based on calculated bitrate to preserve quality
    let scaleFilter = "scale='min(854,iw)':-2"; // 480p default
    if (videoBitrate < 300 * 1024) {
      scaleFilter = "scale='min(640,iw)':-2"; // 360p fallback
    }
    if (videoBitrate < 150 * 1024) {
      scaleFilter = "scale='min(426,iw)':-2"; // 240p fallback
    }

    // 3. Compress using ffmpeg (H.264 + AAC)
    // -vf with even width/height, CRF 28, maxrate constrained to target bitrate
    const ffmpegCmd = `ffmpeg -y -i "${tempInput}" -vf "${scaleFilter}" -c:v libx264 -crf 28 -preset medium -maxrate ${Math.floor(videoBitrate)} -bufsize ${Math.floor(videoBitrate * 2)} -c:a aac -b:a 64k -movflags +faststart "${tempOutput}"`;
    await execPromise(ffmpegCmd);

    const compressedBuffer = fs.readFileSync(tempOutput);

    if (compressedBuffer.length > 5 * 1024 * 1024) {
      throw new Error('Video cannot be compressed below the 5 MB limit.');
    }

    const outputName = `${path.parse(filename).name}.mp4`;
    return {
      dataUrl: toDataUrl(compressedBuffer, 'video/mp4'),
      type: 'video/mp4',
      name: outputName,
      duration: Math.round(duration)
    };
  } finally {
    // Clean up temp files
    try {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    } catch (e) {
      console.error('Error cleaning up video temp files:', e);
    }
  }
}

/**
 * Optimizes a voice message / audio attachment.
 * - Converts to highly compatible highly compressed AAC in .m4a.
 * - Targets 20-50 KB for short voice messages.
 * - Keeps speech clear and understandable (16kbps AAC-LC is extremely voice optimized).
 */
async function optimizeVoiceMessage(buffer: Buffer, originalMime: string, filename: string): Promise<{ dataUrl: string; type: string; name: string; duration?: number }> {
  // If already below target size (50 KB), skip recompression completely
  if (buffer.length <= 50 * 1024) {
    let duration: number | undefined;
    try {
      const ext = path.extname(filename) || '.webm';
      const tempInput = getTempFilePath(ext);
      fs.writeFileSync(tempInput, buffer);
      const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempInput}"`;
      const { stdout: durationStr } = await execPromise(probeCmd);
      const parsedDuration = parseFloat(durationStr.trim());
      if (!isNaN(parsedDuration)) {
        duration = Math.round(parsedDuration);
      }
      fs.unlinkSync(tempInput);
    } catch (e) {}

    return {
      dataUrl: toDataUrl(buffer, originalMime),
      type: originalMime,
      name: filename,
      duration
    };
  }

  const ext = path.extname(filename) || '.webm';
  const tempInput = getTempFilePath(ext);
  const tempOutput = getTempFilePath('.m4a');

  try {
    fs.writeFileSync(tempInput, buffer);

    // Get duration of audio note if possible
    let duration: number | undefined;
    try {
      const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempInput}"`;
      const { stdout: durationStr } = await execPromise(probeCmd);
      const parsedDuration = parseFloat(durationStr.trim());
      if (!isNaN(parsedDuration)) {
        duration = Math.round(parsedDuration);
      }
    } catch (probeErr) {
      // Non-blocking
    }

    // Compress to voice-optimized AAC at low bitrate
    // 16kbps, mono (-ac 1), and 16kHz sample rate (-ar 16000) is perfect for clear voice notes and tiny file sizes (~120KB per minute)
    const ffmpegCmd = `ffmpeg -y -i "${tempInput}" -c:a aac -b:a 16k -ac 1 -ar 16000 "${tempOutput}"`;
    await execPromise(ffmpegCmd);

    const compressedBuffer = fs.readFileSync(tempOutput);

    // Skip output update if original was somehow smaller (unlikely but safe)
    if (compressedBuffer.length > buffer.length) {
      return {
        dataUrl: toDataUrl(buffer, originalMime),
        type: originalMime,
        name: filename,
        duration
      };
    }

    const outputName = `${path.parse(filename).name}.m4a`;
    return {
      dataUrl: toDataUrl(compressedBuffer, 'audio/m4a'),
      type: 'audio/m4a',
      name: outputName,
      duration
    };
  } finally {
    // Clean up temp files
    try {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    } catch (e) {
      console.error('Error cleaning up audio temp files:', e);
    }
  }
}

/**
 * Optimizes a PDF or other supported document.
 * - Uses Ghostscript to compress PDF files.
 * - Skips if there is little or no size reduction.
 */
async function optimizeDocument(buffer: Buffer, originalMime: string, filename: string): Promise<{ dataUrl: string; type: string; name: string }> {
  // We can only optimize PDF documents using Ghostscript
  if (originalMime !== 'application/pdf' && !filename.toLowerCase().endsWith('.pdf')) {
    return {
      dataUrl: toDataUrl(buffer, originalMime),
      type: originalMime,
      name: filename
    };
  }

  // If already below 150 KB, skip compression to avoid any quality degradation
  if (buffer.length <= 150 * 1024) {
    return {
      dataUrl: toDataUrl(buffer, originalMime),
      type: originalMime,
      name: filename
    };
  }

  const tempInput = getTempFilePath('.pdf');
  const tempOutput = getTempFilePath('.pdf');

  try {
    fs.writeFileSync(tempInput, buffer);

    // Compress PDF with Ghostscript (/ebook setting preserves barcodes, text & receipts beautifully at 150dpi)
    const gsCmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${tempOutput}" "${tempInput}"`;
    await execPromise(gsCmd);

    const compressedBuffer = fs.readFileSync(tempOutput);

    // Skip compression if size reduction is less than 10%
    if (compressedBuffer.length >= buffer.length * 0.9) {
      return {
        dataUrl: toDataUrl(buffer, originalMime),
        type: originalMime,
        name: filename
      };
    }

    return {
      dataUrl: toDataUrl(compressedBuffer, 'application/pdf'),
      type: 'application/pdf',
      name: filename
    };
  } catch (err) {
    console.error('PDF compression failed, keeping original:', err);
    return {
      dataUrl: toDataUrl(buffer, originalMime),
      type: originalMime,
      name: filename
    };
  } finally {
    try {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    } catch (e) {}
  }
}

const getStorageDir = (): string => {
  if (process.env.PERSISTENT_DIR) {
    return process.env.PERSISTENT_DIR;
  }
  const renderDataPath = '/data';
  try {
    if (fs.existsSync(renderDataPath)) {
      const testFile = path.join(renderDataPath, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return renderDataPath;
    }
  } catch (e) {}
  return process.cwd();
};

const STORAGE_DIR = getStorageDir();
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Computes SHA-256 hash of a buffer.
 */
function computeHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generates an image thumbnail.
 */
async function generateImageThumbnail(buffer: Buffer, outPath: string): Promise<void> {
  try {
    await sharp(buffer)
      .resize({ width: 150, height: 150, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 60 })
      .toFile(outPath);
    console.log(`[Thumbnail] Generated image thumbnail at: ${outPath}`);
  } catch (err) {
    console.error('[Thumbnail] Failed to generate image thumbnail:', err);
  }
}

/**
 * Generates a video thumbnail by extracting a frame at 1s.
 */
async function generateVideoThumbnail(videoPath: string, outPath: string): Promise<void> {
  try {
    const cmd = `ffmpeg -y -i "${videoPath}" -ss 00:00:01.00 -vframes 1 -vf "scale='min(150,iw)':-1" "${outPath}"`;
    await execPromise(cmd);
    console.log(`[Thumbnail] Generated video thumbnail at: ${outPath}`);
  } catch (err) {
    console.error('[Thumbnail] Failed to generate video thumbnail:', err);
  }
}

/**
 * Optimizes any incoming attachment.
 * Dispatches to correct optimizer based on mime type.
 * Server-side compression ensures all clients receive highly compressed, optimized files.
 * Reuses existing stored files (duplicate-file detection using content hash).
 */
export async function optimizeAttachment(attachment: Attachment): Promise<Attachment> {
  // Never recompress a file more than once. If an uploaded file is already optimized or points to our API, reuse it.
  if (attachment.isOptimized || (attachment.data && attachment.data.startsWith('/api/attachments/'))) {
    console.log(`[Upload Optimization] Skipping optimization because attachment "${attachment.name}" is already optimized/stored.`);
    return attachment;
  }

  const { buffer, mimeType } = parseBase64(attachment.data);
  const type = (attachment.type || mimeType || '').toLowerCase();
  const name = attachment.name || 'unnamed-file';

  // 1. First-level check: Has this exact original file been uploaded and processed before?
  const originalHash = computeHash(buffer);
  const originalMetaPath = path.join(UPLOADS_DIR, `${originalHash}.json`);
  const originalFilePath = path.join(UPLOADS_DIR, originalHash);

  if (fs.existsSync(originalFilePath) && fs.existsSync(originalMetaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(originalMetaPath, 'utf8'));
      const targetHash = meta.optimizedHash || originalHash;
      console.log(`[Upload Optimization] Duplicate detected via original hash! Reusing stored file for: ${name}`);
      return {
        name: meta.name || name,
        type: meta.type || type,
        data: `/api/attachments/${targetHash}/${encodeURIComponent(meta.name || name)}`,
        duration: meta.duration !== undefined ? meta.duration : attachment.duration,
        isOptimized: true
      };
    } catch (e) {
      console.warn('[Upload Optimization] Error reading metadata for original hash duplicate:', e);
    }
  }

  console.log(`[Upload Optimization] Optimizing: ${name} (${type}, original size: ${(buffer.length / 1024).toFixed(1)} KB)`);

  let result: { dataUrl: string; type: string; name: string; duration?: number };

  if (type.startsWith('image/')) {
    result = await optimizeImage(buffer, type, name);
  } else if (type.startsWith('video/')) {
    result = await optimizeVideo(buffer, type, name);
  } else if (type.startsWith('audio/')) {
    result = await optimizeVoiceMessage(buffer, type, name);
  } else if (type === 'application/pdf') {
    result = await optimizeDocument(buffer, type, name);
  } else {
    // Other documents (DOCX, XLSX) - compression yields negligible size savings, return as is
    result = {
      dataUrl: toDataUrl(buffer, type),
      type: type,
      name: name
    };
  }

  const optimizedBuffer = parseBase64(result.dataUrl).buffer;
  const optimizedHash = computeHash(optimizedBuffer);
  
  const filePath = path.join(UPLOADS_DIR, optimizedHash);
  const metaPath = path.join(UPLOADS_DIR, `${optimizedHash}.json`);
  const thumbPath = path.join(UPLOADS_DIR, `${optimizedHash}_thumb`);

  console.log(`[Upload Optimization] Complete: ${result.name} (${result.type}, optimized size: ${(optimizedBuffer.length / 1024).toFixed(1)} KB)`);

  // 2. Second-level check: Does the optimized content match an existing stored file?
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, optimizedBuffer);
    
    // Generate and cache thumbnail exactly once
    if (result.type.startsWith('image/')) {
      await generateImageThumbnail(optimizedBuffer, thumbPath);
    } else if (result.type.startsWith('video/')) {
      await generateVideoThumbnail(filePath, thumbPath);
    }
  } else {
    console.log(`[Upload Optimization] Duplicate detected via optimized content hash: ${optimizedHash}`);
  }

  // Write metadata JSON
  const meta = {
    name: result.name,
    type: result.type,
    duration: result.duration !== undefined ? result.duration : attachment.duration
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  // Map original hash to optimized file to bypass processing next time the exact same file is uploaded
  if (originalHash !== optimizedHash) {
    const linkMeta = {
      name: result.name,
      type: result.type,
      duration: result.duration !== undefined ? result.duration : attachment.duration,
      optimizedHash: optimizedHash
    };
    fs.writeFileSync(originalMetaPath, JSON.stringify(linkMeta, null, 2));
    // Save original file placeholder or data to speed up existence checks
    fs.writeFileSync(originalFilePath, optimizedBuffer);
  }

  return {
    name: result.name,
    type: result.type,
    data: `/api/attachments/${optimizedHash}/${encodeURIComponent(result.name)}`,
    duration: result.duration !== undefined ? result.duration : attachment.duration,
    isOptimized: true
  };
}

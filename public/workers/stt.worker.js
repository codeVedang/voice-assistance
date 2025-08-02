// public/workers/stt.worker.js

// Use the modern 'import' statement because this is a module.
import { pipeline, env } from '../libs/transformers.min.js';

console.log("DEBUG_WORKER: STT Worker script loaded as a module.");

env.allowLocalModels = true;
env.useBrowserCache = true;

let transcriber;

self.onmessage = async (event) => {
  const { type, data } = event.data;

  if (type === 'init') {
    try {
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', {
          quantized: true,
          progress_callback: progress => {
            console.log("DEBUG_WORKER: Downloading STT model...", progress);
          }
      });
      self.postMessage({ type: 'init_done' });
    } catch (e) {
      console.error("DEBUG_WORKER: Failed to initialize STT:", e);
      self.postMessage({ type: 'error', data: 'Failed to initialize STT: ' + e });
    }
  } 
  else if (type === 'transcribe') {
    if (!transcriber) {
      self.postMessage({ type: 'error', data: 'Transcriber not initialized.' });
      return;
    }
    const { audio } = data;
    try {
        const result = await transcriber(audio);
        self.postMessage({
            type: 'transcript_final',
            data: result.text,
        });
    } catch(e) {
        console.error("DEBUG_WORKER: STT transcription failed:", e);
        self.postMessage({ type: 'error', data: 'STT transcription failed: ' + e });
    }
  }
};
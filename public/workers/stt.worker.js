// public/workers/stt.worker.js

// Import the library from the local file as a module
import { pipeline, env } from '../libs/transformers.min.js';

env.allowLocalModels = true;
env.useBrowserCache = true;

let transcriber;

self.onmessage = async (event) => {
  const { type, data } = event.data;

  if (type === 'init') {
    try {
      // Initialize the speech-to-text pipeline
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', {
          quantized: true,
      });
      self.postMessage({ type: 'init_done' });
    } catch (e) {
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
        self.postMessage({ type: 'error', data: 'STT transcription failed: ' + e });
    }
  }
};

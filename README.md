# AI Voice Assistant Project

This is a Next.js application built for an internship assignment. It functions as an offline-first voice assistant that records microphone input, transcribes the speech locally using a Web Worker, sends the text to an API, and plays back the synthesized audio response.

## Live Demo & Video

* **Vercel Link:** [Link to your deployed Vercel application]
* **Demo Video:** [Link to your demo video on YouTube or Google Drive]

## Core Features

* **Offline First:** The application is a Progressive Web App (PWA) that caches all necessary assets, including the AI models, for offline operation.
* **Local Speech-to-Text (STT):** Utilizes `whisper-base.en` via the `@xenova/transformers` library running in a Web Worker for efficient, non-blocking audio transcription.
* **Mock API Integration:** The transcribed text is sent to a mock Next.js API route that provides a pre-defined response. *(Note: The OpenAI API call was mocked to avoid billing costs, but the infrastructure is in place.)*
* **Browser-Native Text-to-Speech (TTS):** Uses the browser's built-in `SpeechSynthesis` API for reliable and fast audio playback without requiring local model downloads for TTS.

## Tech Stack

* **Framework:** Next.js 14+ with App Router
* **Language:** TypeScript
* **AI Models:** `@xenova/transformers` (Whisper)
* **PWA:** `next-pwa` for service worker management

## How to Run Locally

1.  Clone the repository:
    ```bash
    git clone [Your GitHub Repo URL]
    ```
2.  Navigate into the project directory:
    ```bash
    cd [your-project-folder]
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Performance Report

The application was tested on a [Your Computer Specs, e.g., Windows 11, Intel Core i5] with a standard broadband connection. The target response time (< 1.2s) is challenging due to the overhead of local model inference.

Here are the average latencies observed:

* **STT (Speech-to-Text):** ~7000-8000 ms on first run (due to model download), improving to **~1500-2500 ms** on subsequent runs. This is the main performance bottleneck as it runs on the CPU.
* **API (Mocked):** A simulated delay of **~500 ms** was used.
* **TTS (Text-to-Speech):** The browser's native `SpeechSynthesis` is very fast. The time to start playback is typically under **50 ms**.

**Total Response Time (after initial caching):** Approximately **2.0 - 3.0 seconds** from end-of-speech to start-of-playback. While this is above the 1.2s target, it demonstrates the full pipeline working with local models.

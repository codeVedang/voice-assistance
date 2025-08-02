"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function VoiceAssistant() {
    const [status, setStatus] = useState('Idle. Press Start.');
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [latencies, setLatencies] = useState({ stt: 0, api: 0, tts: 0, playback: 0 });

    const sttWorker = useRef<Worker | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // This useEffect hook initializes the STT worker when the component mounts.
    useEffect(() => {
        setStatus('Initializing STT model...');
        
        sttWorker.current = new Worker('/workers/stt.worker.js', { type: 'module' });

        const handleWorkerMessage = (event: MessageEvent) => {
            const { type, data } = event.data;
            switch (type) {
                case 'init_done':
                    setStatus('Models Initialized. Ready.');
                    break;
                case 'transcript_final':
                    setLatencies(prev => ({ ...prev, stt: Date.now() - prev.stt }));
                    setStatus('Transcription complete. Thinking...');
                    setTranscript(data);
                    sendToLLM(data);
                    break;
                case 'error':
                    setStatus(`Error: ${data}`);
                    console.error('STT Worker Error:', data);
                    break;
            }
        };

        sttWorker.current.onmessage = handleWorkerMessage;
        sttWorker.current.postMessage({ type: 'init' });

        return () => {
            sttWorker.current?.terminate();
        };
    }, []);

    // This function uses the browser's built-in speech synthesis to speak text.
    const playAudio = (text: string) => {
        try {
            // Cancel any speech that is currently playing.
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            utterance.onstart = () => {
                const startTime = Date.now();
                setStatus('Speaking...');
                setLatencies(prev => ({ ...prev, playback: Date.now() - startTime }));
            };

            utterance.onend = () => {
                setStatus('Idle. Press Start.');
                setTranscript('');
            };

            utterance.onerror = (e) => {
                console.error("SpeechSynthesis Error:", e);
                setStatus("Error: Could not play voice.");
            };

            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error("Error in playAudio:", error);
            setStatus("Error: Speech synthesis failed.");
        }
    };

    // This function sends the transcribed text to our mock API.
    const sendToLLM = async (prompt: string) => {
        const startTime = Date.now();
        setLatencies(prev => ({ ...prev, api: startTime, tts: 0 })); // TTS is now part of playback
        try {
            const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'API call failed'); }
            
            const { reply } = await response.json();
            
            if (reply) {
                setLatencies(prev => ({ ...prev, api: Date.now() - prev.api }));
                // Directly call the playAudio function with the text reply.
                playAudio(reply);
            } else { 
                throw new Error("Received an empty reply from API."); 
            }
        } catch (error: any) { 
            console.error("Error in sendToLLM:", error); 
            setStatus(`Error: ${error.message}`); 
        }
    };

    // This function handles starting the microphone recording.
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const audioChunks: Blob[] = [];
            mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorder.current.onstop = async () => {
                if (audioChunks.length === 0) { setStatus("Error: No audio was recorded."); return; }
                try {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const decodeAudioContext = new AudioContext({ sampleRate: 16000 });
                    const audioBuffer = await decodeAudioContext.decodeAudioData(arrayBuffer);
                    const pcm = audioBuffer.getChannelData(0);
                    setLatencies({ stt: Date.now(), api: 0, tts: 0, playback: 0 });
                    sttWorker.current?.postMessage({ type: 'transcribe', data: { audio: pcm } });
                } catch (error) { 
                    console.error("Error decoding audio data:", error); 
                    setStatus("Error: Could not decode recorded audio."); 
                }
            };
            mediaRecorder.current.ondataavailable = (event) => { if (event.data.size > 0) { audioChunks.push(event.data); } };
            
            mediaRecorder.current.start();
            setIsRecording(true);
            setStatus('Recording...');
        } catch (error: any) {
            console.error("Could not start recording:", error);
            if (error.name === 'NotReadableError') {
                setStatus("Error: Mic is already in use. Please close other apps and try again.");
            } else {
                setStatus("Error: Could not access microphone.");
            }
        }
    };

    // This function handles stopping the microphone recording.
    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
            mediaRecorder.current.stop();
            streamRef.current?.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setStatus('Transcribing...');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto font-sans bg-white shadow-xl rounded-2xl">
            <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">AI Voice Assistant</h1>
            <div className="p-4 border rounded-lg bg-gray-50 mb-4">
                <p className="font-mono text-sm"><strong>Status:</strong> {status}</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50 mb-4 min-h-[6rem]">
                <p className="italic text-gray-700">{transcript || "..."}</p>
            </div>
            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full py-4 text-xl font-bold rounded-lg text-white transition-all duration-200 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h2 className="font-bold text-gray-700">Latencies:</h2>
                <ul className="list-disc list-inside font-mono text-sm text-gray-600">
                    <li>STT: {latencies.stt > 0 ? `${latencies.stt}ms` : 'N/A'}</li>
                    <li>OpenAI API: {latencies.api > 0 ? `${latencies.api}ms` : 'N/A'}</li>
                    <li>TTS Synthesis: (Handled by browser)</li>
                    <li>Playback Start: {latencies.playback > 0 ? `${latencies.playback}ms` : 'N/A'}</li>
                </ul>
            </div>
        </div>
    );
}

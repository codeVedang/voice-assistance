// pages/index.tsx
import VoiceAssistant from './components/VoiceAssistant';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <VoiceAssistant />
    </main>
  );
}
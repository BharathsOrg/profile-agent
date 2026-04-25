'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export function VoiceMicButton() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected to ElevenLabs Agent'),
    onDisconnect: () => console.log('Disconnected from ElevenLabs Agent'),
    onMessage: (message) => console.log('Message received:', message),
    onError: (error) => console.error('ElevenLabs Error:', error),
  });

  const getSignedUrl = async (): Promise<string> => {
    const response = await fetch("/api/get-signed-url");
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Failed to get signed url: ${body.error ?? response.statusText}`);
    }
    const { signedUrl } = await response.json();
    return signedUrl;
  };

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const signedUrl = await getSignedUrl();
      await conversation.startSession({ signedUrl });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';

  const title = isConnected
    ? conversation.isSpeaking ? 'Agent is speaking…' : 'Listening — click to end'
    : 'Start voice conversation';

  return (
    <div className="relative flex items-center justify-center">
      {isConnected && (
        <span className="absolute inset-0 rounded-full animate-ping bg-red-500/40" />
      )}
      <button
        onClick={isConnected ? stopConversation : startConversation}
        disabled={isConnecting}
        title={title}
        className={[
          'relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500',
          isConnected
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : isConnecting
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200',
        ].join(' ')}
      >
        {isConnecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isConnected ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

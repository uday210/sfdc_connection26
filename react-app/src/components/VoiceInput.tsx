'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface Props {
  onTranscript: (text: string) => void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function VoiceInput({ onTranscript }: Props) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window))
  const recRef = useRef<SpeechRecognition | null>(null)

  const toggle = useCallback(() => {
    if (!supported) return

    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript
      onTranscript(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)

    recRef.current = rec
    rec.start()
    setListening(true)
  }, [listening, onTranscript, supported])

  if (!supported) return null

  return (
    <button
      onClick={toggle}
      title={listening ? 'Stop listening' : 'Speak a command'}
      className={`p-2 rounded-full transition-colors ${listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
    >
      {listening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  )
}

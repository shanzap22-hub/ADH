"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Types for Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export function useWebSpeech() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    // Refs to keep track of instances
    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    // We no longer need a separate interim ref because interim results are disabled
    const accumulatedTranscriptRef = useRef<string>("");


    useEffect(() => {
        if (typeof window !== "undefined") {
            const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
            const BrowserSpeechRecognition = SpeechRecognition || webkitSpeechRecognition;

            if (BrowserSpeechRecognition && window.speechSynthesis) {
                setIsSupported(true);

                // Initialize Recognition
                const recognition = new BrowserSpeechRecognition();
                // Disable continuous mode – we will manually restart on end if needed
                recognition.continuous = false;
                // Disable interim results – we only care about final transcripts
                recognition.interimResults = false;
                recognition.lang = "en-US"; // Default to English, can be parametrized


                recognition.onstart = () => {
                    // Reset accumulated transcript when starting a new session
                    accumulatedTranscriptRef.current = "";
                    setIsListening(true);
                };
                recognition.onend = () => setIsListening(false);
                recognition.onresult = (event: any) => {
                    // With interimResults disabled, we only get final results
                    const result = event.results[0];
                    if (!result) return;
                    if (result.isFinal) {
                        const finalText = result[0].transcript;
                        // Guard against duplicate finals (mobile browsers may fire the same final twice)
                        if (!accumulatedTranscriptRef.current.endsWith(finalText)) {
                            accumulatedTranscriptRef.current += finalText;
                        }
                        setTranscript(accumulatedTranscriptRef.current);
                    }
                };

                recognitionRef.current = recognition;
                synthesisRef.current = window.speechSynthesis;
            }
        }
    }, []);

    // Ref to keep track of whether we want auto‑restart after onend
    const isListeningRef = useRef<boolean>(false);

    const startListening = useCallback((lang: string = "en-US") => {
        if (recognitionRef.current && !isListening) {
            setTranscript("");
            accumulatedTranscriptRef.current = ""; // reset accumulated transcript
            isListeningRef.current = true; // we want to keep listening (auto‑restart)
            try {
                recognitionRef.current.lang = lang; // Update language dynamically
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Speech recognition start failed", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            // User explicitly stopped listening – prevent auto‑restart
            isListeningRef.current = false;
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const speak = useCallback((text: string) => {
        if (synthesisRef.current) {
            // Cancel any ongoing speech
            synthesisRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            synthesisRef.current.speak(utterance);
        }
    }, []);

    const stopSpeaking = useCallback(() => {
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return {
        isSupported,
        isListening,
        transcript,
        startListening,
        stopListening,
        speak,
        isSpeaking,
        stopSpeaking
    };
}

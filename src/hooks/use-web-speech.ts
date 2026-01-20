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
    const lastInterimRef = useRef<string>("");
    const accumulatedTranscriptRef = useRef<string>("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
            const BrowserSpeechRecognition = SpeechRecognition || webkitSpeechRecognition;

            if (BrowserSpeechRecognition && window.speechSynthesis) {
                setIsSupported(true);

                // Initialize Recognition
                const recognition = new BrowserSpeechRecognition();
                recognition.continuous = true; // Keep listening until stopped manually or timeout
                recognition.interimResults = true;
                recognition.lang = "en-US"; // Default to English, can be parametrized


                recognition.onstart = () => {
                    // Reset last interim and accumulated transcript when starting
                    lastInterimRef.current = "";
                    accumulatedTranscriptRef.current = "";
                    setIsListening(true);
                };
                recognition.onend = () => setIsListening(false);
                recognition.onresult = (event: any) => {
                    // Get the most recent result (the last one in the list)
                    const lastResult = event.results[event.results.length - 1];
                    if (!lastResult) return;
                    if (lastResult.isFinal) {
                        // Append final transcript to the accumulated ref
                        accumulatedTranscriptRef.current += lastResult[0].transcript;
                        setTranscript(accumulatedTranscriptRef.current);
                    } else {
                        // Use interim transcript (replace previous interim)
                        const interim = lastResult[0].transcript;
                        setTranscript(accumulatedTranscriptRef.current + interim);
                    }
                };

                recognitionRef.current = recognition;
                synthesisRef.current = window.speechSynthesis;
            }
        }
    }, []);

    const startListening = useCallback((lang: string = "en-US") => {
        if (recognitionRef.current && !isListening) {
            setTranscript("");
            accumulatedTranscriptRef.current = ""; // Clear accumulated transcript
            try {
                recognitionRef.current.lang = lang; // Update language dynamically
                recognitionRef.current.start();
            } catch (e) {
                console.error("Speech recognition start failed", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
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

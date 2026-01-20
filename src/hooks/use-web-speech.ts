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

    useEffect(() => {
        if (typeof window !== "undefined") {
            const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
            const BrowserSpeechRecognition = SpeechRecognition || webkitSpeechRecognition;

            if (BrowserSpeechRecognition && window.speechSynthesis) {
                setIsSupported(true);

                // Initialize Recognition
                const recognition = new BrowserSpeechRecognition();
                recognition.continuous = false; // Stop after one sentence/pause
                recognition.interimResults = true;
                recognition.lang = "en-US"; // Default to English, can be parametrized

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);
                recognition.onresult = (event: any) => {
                    let interimTranscript = "";
                    let finalTranscript = "";

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }
                    setTranscript(finalTranscript || interimTranscript);
                };

                recognitionRef.current = recognition;
                synthesisRef.current = window.speechSynthesis;
            }
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript("");
            try {
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

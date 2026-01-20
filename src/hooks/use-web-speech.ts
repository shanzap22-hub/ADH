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
    const [lang, setLang] = useState("en-US"); // Default to English, switchable to ml-IN

    // Refs to keep track of instances
    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
            const BrowserSpeechRecognition = SpeechRecognition || webkitSpeechRecognition;

            if (BrowserSpeechRecognition && window.speechSynthesis) {
                setIsSupported(true);

                // Create recognition instance
                const recognition = new BrowserSpeechRecognition();
                recognition.continuous = false; // Stop after one sentence to prevent duplication loops
                recognition.interimResults = true; // Show words as they are spoken

                // Event Handlers
                recognition.onstart = () => setIsListening(true);

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.onresult = (event: any) => {
                    let finalTranscript = "";
                    let interimTranscript = "";

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    // Prioritize final, fallback to interim
                    const currentText = finalTranscript || interimTranscript;
                    setTranscript(currentText);
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
                synthesisRef.current = window.speechSynthesis;
            }
        }
    }, []);

    // Update language dynamically
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = lang;
        }
    }, [lang]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript(""); // Clear previous
            try {
                recognitionRef.current.start();
            } catch (e) {
                // If already started, ignore
                console.warn("Recognition already started");
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
        lang,
        setLang,
        startListening,
        stopListening,
        speak,
        isSpeaking,
        stopSpeaking
    };
}

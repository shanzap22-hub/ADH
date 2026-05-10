"use client";
import { useState, useRef } from "react";

export default function TTSTest() {
    const [status, setStatus] = useState("Idle");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const testAPI = async () => {
        try {
            setStatus("Testing API...");
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: "ഇതൊരു മലയാളം ടെസ്റ്റ് ആണ്", lang: "ml-IN" })
            });
            if (!res.ok) throw new Error("API returned " + res.status);
            const data = await res.json();
            setStatus("API Success: " + (data.audioUrl ? "Got URL" : "Got Base64"));
            if (audioRef.current) {
                audioRef.current.src = data.audioUrl || `data:audio/mpeg;base64,${data.audioBase64}`;
                await audioRef.current.play();
                setStatus("Playing API Audio...");
            }
        } catch (e: any) {
            setStatus("API Error: " + e.message);
        }
    };

    const testFallback = async () => {
        try {
            setStatus("Testing Fallback...");
            const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent("ഇതൊരു മലയാളം ടെസ്റ്റ് ആണ്")}&tl=ml&client=gtx`;
            if (audioRef.current) {
                audioRef.current.src = url;
                await audioRef.current.play();
                setStatus("Playing Fallback Audio...");
            }
        } catch (e: any) {
            setStatus("Fallback Error: " + e.message);
        }
    };

    return (
        <div className="p-10" style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <h1 className="text-2xl font-bold">Malayalam TTS Test</h1>
            <p className="mt-4 text-xl" id="status-text">Status: {status}</p>
            <div className="mt-4">
                <button id="btn-api" onClick={testAPI} className="border p-2 m-2 bg-blue-500 text-white">Test API</button>
                <button id="btn-fallback" onClick={testFallback} className="border p-2 m-2 bg-green-500 text-white">Test Fallback</button>
            </div>
            <audio ref={audioRef} controls className="mt-4" />
        </div>
    );
}

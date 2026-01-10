"use client";

import { useState } from "react";
import { BunnyVideoPlayer } from "@/components/bunny/BunnyVideoPlayer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TestPlayerPage() {
    const [videoId, setVideoId] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [status, setStatus] = useState<string[]>([]);

    const handleLog = (msg: string) => {
        setStatus(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    return (
        <div className="p-10 max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Bunny Video Player - Isolation Test</h1>

            <div className="flex gap-4">
                <Input
                    placeholder="Enter Bunny Video ID to test"
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                />
                <Button onClick={() => setIsPlaying(true)} disabled={!videoId}>
                    Load Player
                </Button>
            </div>

            {isPlaying && (
                <div className="space-y-4">
                    <div className="h-[400px]">
                        <BunnyVideoPlayer
                            videoId={videoId}
                            onEnd={() => handleLog("✅ SUCCESS: onEnd Callback Triggered (Auto-Completion Working!)")}
                        />
                    </div>
                </div>
            )}

            <div className="bg-slate-100 p-4 rounded-md h-64 overflow-auto border">
                <h3 className="font-semibold mb-2">Test Logs:</h3>
                {status.length === 0 && <p className="text-gray-400">Waiting for events...</p>}
                {status.map((log, i) => (
                    <div key={i} className={`font-mono text-sm ${log.includes("SUCCESS") ? "text-green-600 font-bold" : "text-slate-700"}`}>
                        {log}
                    </div>
                ))}
            </div>

            <p className="text-sm text-gray-500">
                Note: Check the browser console (F12) for detailed internal logs from the player component.
            </p>
        </div>
    );
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle2 } from 'lucide-react'

export default function ConnectCalendarButton() {
    const [loading, setLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            // Check if refresh token exists in metadata
            if (user?.user_metadata?.google_refresh_token) {
                setIsConnected(true)
            }
        }
        checkStatus()
    }, [supabase])

    const handleConnect = async () => {
        setLoading(true)
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes: 'https://www.googleapis.com/auth/calendar.events',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })
        } catch (error) {
            console.error("Error connecting calendar:", error)
            setLoading(false)
        }
    }

    if (isConnected) {
        return (
            <Button
                onClick={handleConnect}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
            >
                <CheckCircle2 className="h-4 w-4" />
                {loading ? 'Reconnecting...' : 'Calendar Connected'}
            </Button>
        )
    }

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
        >
            <Calendar className="h-4 w-4" />
            {loading ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
    )
}

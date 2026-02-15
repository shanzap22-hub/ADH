'use client';

import { createMindMap } from '@/actions/mind-map';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateMindMapButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onClick = async () => {
        try {
            setIsLoading(true);
            const newMap = await createMindMap('Untitled Mind Map');
            toast.success('Mind map created');
            router.push(`/instructor/mind-maps/${newMap.id}`);
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Button onClick={onClick} disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
            )}
            New Mind Map
        </Button>
    );
}

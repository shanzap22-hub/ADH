import { getMindMap } from '@/actions/mind-map';
import MindMapEditor from '@/components/mind-map/MindMapEditor';
import { notFound } from 'next/navigation';

interface MindMapPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function MindMapPage(props: MindMapPageProps) {
    const params = await props.params;
    const mindMap = await getMindMap(params.id);

    if (!mindMap) {
        notFound();
    }

    return (
        <div className="h-screen w-full border-0 overflow-hidden">
            <MindMapEditor initialData={mindMap} id={params.id} />
        </div>
    );
}

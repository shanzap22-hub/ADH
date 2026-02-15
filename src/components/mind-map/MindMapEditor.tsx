'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    ReactFlowProvider,
    Panel,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useMindMapStore from './store';
import MindMapNode from './nodes/MindMapNode';
import MindMapToolbar from './MindMapToolbar';
import { updateMindMap } from '@/actions/mind-map';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';

const nodeTypes = {
    mindMap: MindMapNode,
};

interface MindMapEditorProps {
    initialData: any;
    id: string;
}

function MindMapFlow({ initialData, id }: MindMapEditorProps) {
    // Zustand integration
    // We synchronize the local React Flow state with Zustand or just use Zustand directly?
    // The issue with Zustand and ReactFlow is that ReactFlow expects local state hooks for performance often, 
    // or specific onNodesChange handlers.
    // Our store `useMindMapStore` has `onNodesChange`, `nodes`, `edges`.
    // Let's uset solely the store.

    const nodes = useMindMapStore((state) => state.nodes);
    const edges = useMindMapStore((state) => state.edges);
    const onNodesChange = useMindMapStore((state) => state.onNodesChange);
    const onEdgesChange = useMindMapStore((state) => state.onEdgesChange);
    const onConnect = useMindMapStore((state) => state.onConnect);
    const setNodes = useMindMapStore((state) => state.setNodes);
    const setEdges = useMindMapStore((state) => state.setEdges);

    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState(initialData?.title || 'Untitled Mind Map');
    const reactFlowWrapper = useRef(null);
    const { getViewport } = useReactFlow();

    useEffect(() => {
        if (initialData) {
            if (initialData.content?.nodes) setNodes(initialData.content.nodes);
            if (initialData.content?.edges) setEdges(initialData.content.edges);
            if (initialData.title) setTitle(initialData.title);
        }
    }, [initialData, setNodes, setEdges]);

    const onSave = async () => {
        setIsSaving(true);
        try {
            const content = {
                nodes,
                edges,
                viewport: getViewport()
            };
            await updateMindMap(id, content, title); // Pass title to update
            toast.success('Mind map saved');
        } catch (error) {
            toast.error('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const onExport = useCallback(() => {
        if (reactFlowWrapper.current === null) {
            return;
        }

        toPng(reactFlowWrapper.current, { cacheBust: true, backgroundColor: '#f8fafc' }) // slate-50 background
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error('oops, something went wrong!', err);
                toast.error('Failed to export image');
            });
    }, [id, title]);

    return (
        <div className="w-full h-[calc(100vh-80px)]" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-slate-50"
                deleteKeyCode={['Backspace', 'Delete']}
            >
                <Background />
                <Controls />
                <MindMapToolbar
                    onSave={onSave}
                    onExport={onExport}
                    isSaving={isSaving}
                    title={title}
                    onTitleChange={setTitle}
                />
            </ReactFlow>
            <style jsx global>{`
                .react-flow__attribution {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
                a[aria-label="React Flow attribution"] {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}

export default function MindMapEditor(props: MindMapEditorProps) {
    return (
        <ReactFlowProvider>
            <MindMapFlow {...props} />
        </ReactFlowProvider>
    );
}

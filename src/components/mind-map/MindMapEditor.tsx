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
    useReactFlow,
    ConnectionMode,
    getNodesBounds
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useMindMapStore from './store';
import MindMapNode from './nodes/MindMapNodeComponent';
import GradientEdge from './edges/GradientEdge';
import MindMapToolbar from './MindMapToolbar';
import { updateMindMap } from '@/actions/mind-map';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

const nodeTypes = {
    mindMap: MindMapNode,
};

const edgeTypes = {
    gradient: GradientEdge,
};

interface MindMapEditorProps {
    initialData: any;
    id: string;
}

function MindMapFlow({ initialData, id }: MindMapEditorProps) {
    // Zustand integration
    const nodes = useMindMapStore((state) => state.nodes);
    const edges = useMindMapStore((state) => state.edges);
    const onNodesChange = useMindMapStore((state) => state.onNodesChange);
    const onEdgesChange = useMindMapStore((state) => state.onEdgesChange);
    const onConnect = useMindMapStore((state) => state.onConnect);
    const setNodes = useMindMapStore((state) => state.setNodes);
    const setEdges = useMindMapStore((state) => state.setEdges);

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [title, setTitle] = useState(initialData?.title || 'Untitled Mind Map');

    // Auto-save ref to track latest state without triggering effects
    const stateRef = useRef({ nodes, edges, title });

    // Helper to strip internal ReactFlow properties for comparison
    const cleanState = useCallback((data: { nodes: any[], edges: any[], title: string }) => {
        return JSON.stringify({
            title: data.title,
            nodes: data.nodes.map(n => ({
                id: n.id,
                type: n.type,
                position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
                data: n.data,
            })),
            edges: data.edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                type: e.type,
                style: e.style,
                animated: e.animated,
            }))
        });
    }, []);

    const lastSavedStateRef = useRef(cleanState({
        nodes: initialData?.content?.nodes || [],
        edges: initialData?.content?.edges || [],
        title: initialData?.title || 'Untitled Mind Map'
    }));

    useEffect(() => {
        stateRef.current = { nodes, edges, title };
    }, [nodes, edges, title]);

    const reactFlowWrapper = useRef(null);
    const { getViewport, getNodes } = useReactFlow();

    const initializedRef = useRef(false);

    useEffect(() => {
        // Only initialize if we have data
        if (!initialData) return;

        // If we've already initialized once in this mount, skip (unless we want to support real-time updates from server)
        if (initializedRef.current) return;

        // CRITICAL LOOP FIX:
        const incomingState = cleanState({
            nodes: initialData.content?.nodes || [],
            edges: initialData.content?.edges || [],
            title: initialData.title || ''
        });

        const currentState = cleanState({
            nodes: stateRef.current.nodes,
            edges: stateRef.current.edges,
            title: stateRef.current.title
        });

        if (incomingState === currentState) {
            initializedRef.current = true;
            lastSavedStateRef.current = incomingState;
            return;
        }

        initializedRef.current = true;

        if (initialData.content?.nodes) setNodes(initialData.content.nodes);
        if (initialData.content?.edges) setEdges(initialData.content.edges);
        if (initialData.title) setTitle(initialData.title);

        lastSavedStateRef.current = incomingState;

    }, [initialData, setNodes, setEdges, cleanState, setTitle]);

    const onSave = useCallback(async () => {
        try {
            const { nodes, edges, title } = stateRef.current;
            const currentStateString = cleanState({ nodes, edges, title });

            if (currentStateString === lastSavedStateRef.current) {
                return;
            }

            setIsSaving(true);
            const content = {
                nodes,
                edges,
                viewport: getViewport()
            };
            await updateMindMap(id, content, title);
            setLastSaved(new Date());
            lastSavedStateRef.current = currentStateString;
        } catch (error) {
            toast.error('Failed to save');
        } finally {
            setIsSaving(false);
        }
    }, [id, getViewport, cleanState]);

    useEffect(() => {
        const timer = setTimeout(() => {
            onSave();
        }, 2000);

        return () => clearTimeout(timer);
    }, [nodes, edges, title, onSave]);

    const onExport = useCallback(() => {
        console.log('onExport called');

        if (reactFlowWrapper.current === null) {
            console.error('reactFlowWrapper is null');
            return;
        }

        const nodes = getNodes();
        if (nodes.length === 0) {
            toast.error('No nodes to export');
            return;
        }

        const nodesBounds = getNodesBounds(nodes);

        // 1. Setup Capture Metrics
        const padding = 50;
        const scale = 1;

        const mapWidth = (nodesBounds.width + (padding * 2)) * scale;
        const mapHeight = (nodesBounds.height + (padding * 2)) * scale;

        const transformX = (-nodesBounds.x + padding) * scale;
        const transformY = (-nodesBounds.y + padding) * scale;

        console.log('Export Bounds:', { mapWidth, mapHeight });

        // TARGET THE VIEWPORT DIRECTLY
        const viewportElem = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportElem) {
            console.error('Viewport element not found');
            return;
        }

        // 2. Setup Page Metrics based on Screen/Container Size
        // We use the container's client dimensions as the "Page" unit.
        // This ensures the aspect ratio matches what the user sees on screen.
        const screenW = reactFlowWrapper.current.clientWidth;
        const screenH = reactFlowWrapper.current.clientHeight;

        // Use these as the PDF page dimensions (in points, 1px = 1pt approx for PDF)
        const pdfPageWidth = screenW;
        const pdfPageHeight = screenH;

        const windowW = pdfPageWidth;
        const windowH = pdfPageHeight;

        // Columns and Rows needed to cover the map
        const cols = Math.ceil(mapWidth / windowW);
        const rows = Math.ceil(mapHeight / windowH);
        const totalPages = cols * rows;

        console.log(`Export Grid: ${cols} cols x ${rows} rows (Page Size: ${windowW}x${windowH})`);

        if (totalPages > 1) {
            toast.info(`Splitting map into ${totalPages} pages (${cols}x${rows})`);
        } else {
            toast.info(`Map fits on a single page`);
        }

        const imageOptions = {
            cacheBust: true,
            backgroundColor: '#f8fafc',
            width: mapWidth,
            height: mapHeight,
            style: {
                width: `${mapWidth}px`,
                height: `${mapHeight}px`,
                transform: `translate(${transformX}px, ${transformY}px) scale(${scale})`,
            },
            pixelRatio: 2, // Revert to 2 as requested
        };

        const loadingToast = toast.loading('Generating Mind Map PDF...');

        toPng(viewportElem, imageOptions)
            .then(async (dataUrl) => {

                // Initialize PDF with custom size matching the screen/window
                const pdf = new jsPDF({
                    orientation: windowW > windowH ? 'landscape' : 'portrait',
                    unit: 'pt',
                    format: [windowW, windowH]
                });

                const img = new Image();
                img.src = dataUrl;
                await new Promise(resolve => img.onload = resolve);

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Canvas context failed');

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (r > 0 || c > 0) pdf.addPage([windowW, windowH], windowW > windowH ? 'landscape' : 'portrait');

                        const srcX = c * windowW;
                        const srcY = r * windowH;

                        const srcW = Math.min(windowW, mapWidth - srcX);
                        const srcH = Math.min(windowH, mapHeight - srcY);

                        const s = 2;

                        canvas.width = srcW * s;
                        canvas.height = srcH * s;

                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        ctx.drawImage(
                            img,
                            srcX * s, srcY * s, srcW * s, srcH * s,
                            0, 0, srcW * s, srcH * s
                        );

                        const sliceData = canvas.toDataURL('image/png');

                        // Add to PDF (scaled down to points: 1px = 1pt logic)
                        pdf.addImage(sliceData, 'PNG', 0, 0, srcW, srcH);

                        // 4. Overlay Data (Links & Selectable Text)
                        // We iterate all nodes to add:
                        // A: Clickable Areas (Links)
                        // B: Invisible Text (for Copy/Paste & Search)
                        nodes.forEach(node => {
                            const globalX = node.position.x + transformX;
                            const globalY = node.position.y + transformY;
                            const nodeW = node.measured?.width || 150;
                            const nodeH = node.measured?.height || 50;

                            // Check if node is visible on this page slice
                            // We use a loose intersection check
                            if (globalX + nodeW > srcX && globalX < srcX + windowW &&
                                globalY + nodeH > srcY && globalY < srcY + windowH) {

                                // Local coordinates on this PDF page
                                const pdfX = globalX - srcX;
                                const pdfY = globalY - srcY;

                                // --- A. Links ---
                                const linkUrl = node.data.link as string;
                                if (linkUrl) {
                                    // Try to force new tab behavior (browser dependent)
                                    // @ts-ignore - target is not standard but some optimizations might use it
                                    pdf.link(pdfX, pdfY, nodeW, nodeH, { url: linkUrl, target: '_blank' });
                                }

                                // --- B. Selectable Text (Invisible) ---
                                // This allows users to "select" the text on the PDF even though it's an image.
                                // We place transparent text over the node area.
                                const label = node.data.label as string;
                                if (label) {
                                    // SAFEST TRICK: standard text mode but transparent?
                                    // Actually, let's use renderingMode 'invisible' (mode 3)

                                    pdf.saveGraphicsState();
                                    pdf.setGState(new pdf.GState({ opacity: 0 })); // Invisible again

                                    // Estimate font size based on node dimensions (heuristic)
                                    const fontSize = 13; // Compromise size
                                    pdf.setFontSize(fontSize);

                                    // Wrap text to fit inside the node width
                                    const textPadding = 6;
                                    const maxTextWidth = Math.max(nodeW - textPadding, 10);
                                    const lines = pdf.splitTextToSize(label, maxTextWidth);

                                    // Calculate vertical center for multiline text
                                    const lineHeight = fontSize * 1.2;
                                    const totalTextHeight = lines.length * lineHeight;
                                    const textX = pdfX + (nodeW / 2);

                                    // Adjusted vertical centering - pushed down slightly to match HTML rendering
                                    const textY = pdfY + (nodeH / 2) - (totalTextHeight / 2) + (lineHeight / 2) + 3;

                                    pdf.text(lines, textX, textY, {
                                        align: 'center',
                                        baseline: 'middle',
                                        lineHeightFactor: 1.2
                                    });
                                    pdf.restoreGraphicsState();
                                }
                            }
                        });

                        // Page Number footer
                        pdf.setFontSize(9);
                        pdf.setTextColor(150);
                        pdf.text(`Page ${(r * cols) + c + 1} / ${rows * cols}`, 10, pdfPageHeight - 10);
                    }
                }

                try {
                    console.log('Generating Data URI...');
                    const finalDataUri = pdf.output('datauristring');

                    let filename = 'mind-map.pdf';
                    if (title && title.trim().length > 0) {
                        const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
                        const timestamp = new Date().getTime();
                        filename = `${safeTitle}-${timestamp}.pdf`;
                    }

                    const link = document.createElement('a');
                    link.href = finalDataUri;
                    link.download = filename;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();

                    setTimeout(() => document.body.removeChild(link), 100);
                    toast.dismiss(loadingToast);
                    toast.success('Downloaded optimized PDF');

                } catch (e) {
                    console.error('Data URI download failed:', e);
                    pdf.save('mind-map-fallback.pdf');
                }
            })
            .catch((err) => {
                console.error('PDF Export Error:', err);
                toast.dismiss(loadingToast);
                toast.error('Failed to export PDF');
            });
    }, [title, getNodes]);

    useEffect(() => {
        const styleId = 'mindmap-global-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .react-flow__attribution { display: none !important; }
                a[aria-label="React Flow attribution"] { display: none !important; }
                .react-flow__pane { cursor: grab !important; }
                .react-flow__pane.dragging { cursor: grabbing !important; }
                .react-flow__node, .react-flow__node * { cursor: pointer !important; }
                .react-flow__node input, .react-flow__node textarea { cursor: text !important; }
                .react-flow__node.selected .react-flow__handle { background: #3b82f6; }
                .react-flow, .react-flow__renderer, .react-flow__pane { border: none !important; outline: none !important; }
            `;
            document.head.appendChild(style);
        }
    }, []);

    return (
        <div className="fixed inset-0 z-50 w-full h-full bg-slate-50 overflow-hidden" ref={reactFlowWrapper}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', backgroundColor: 'blue', zIndex: 9999 }}></div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-slate-50"
                deleteKeyCode={['Backspace', 'Delete']}
                defaultEdgeOptions={{
                    type: 'default',
                    animated: false,
                    style: {
                        stroke: '#94a3b8',
                        strokeWidth: 2
                    },
                }}
                connectionMode={ConnectionMode.Loose}
            >
                <Background color="#cbd5e1" gap={16} size={1} variant="dots" />
                <Controls />
                <MindMapToolbar
                    onSave={onSave}
                    onExport={onExport}
                    isSaving={isSaving}
                    lastSaved={lastSaved}
                    title={title}
                    onTitleChange={setTitle}
                />
            </ReactFlow>
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

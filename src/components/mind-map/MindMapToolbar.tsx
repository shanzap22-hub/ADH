
import { Button } from '@/components/ui/button';
import { Download, Save, Sparkles, Plus, Layout, Trash2, Image as ImageIcon, Undo2, Redo2, Cloud } from 'lucide-react';
import useMindMapStore, { useTemporalStore } from './store';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { generateMindMapFromAI } from '@/actions/mind-map';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useReactFlow, Node, Edge } from '@xyflow/react';

interface MindMapToolbarProps {
    onSave: () => void;
    onExport: () => void;
    isSaving: boolean;
    lastSaved: Date | null;
    title: string;
    onTitleChange: (title: string) => void;
}

export default function MindMapToolbar({ onSave, onExport, isSaving, lastSaved, title, onTitleChange }: MindMapToolbarProps) {
    const layoutNodes = useMindMapStore((state) => state.layoutNodes);
    const setNodes = useMindMapStore((state) => state.setNodes);
    const setEdges = useMindMapStore((state) => state.setEdges);
    const { getNodes, getEdges, deleteElements } = useReactFlow();

    // Temporal store for Undo/Redo
    const { undo, redo, pastStates, futureStates } = useTemporalStore((state: any) => state);
    const hasPast = pastStates?.length > 0;
    const hasFuture = futureStates?.length > 0;

    const [isAIOpen, setIsAIOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDeleteSelected = () => {
        const nodes = getNodes();
        const edges = getEdges();
        const selectedNodes = nodes.filter((node) => node.selected);
        const selectedEdges = edges.filter((edge) => edge.selected);

        if (selectedNodes.length === 0 && selectedEdges.length === 0) {
            toast.info('Select nodes or edges to delete');
            return;
        }

        deleteElements({ nodes: selectedNodes, edges: selectedEdges });
    };

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const data = await generateMindMapFromAI(topic);

            // Convert JSON structure to Nodes/Edges
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            const BRANCH_COLORS = [
                ['#f97316', '#fdba74'], // Deep Orange -> Orange-300
                ['#f535aa', '#fbcfe8'], // Magenta -> Pink-200
                ['#d946ef', '#f0abfc'], // Fuchsia -> Fuchsia-300
                ['#8b5cf6', '#ddd6fe'], // Violet -> Violet-200
                ['#6366f1', '#a5b4fc'], // Indigo -> Indigo-300
                ['#3b82f6', '#93c5fd'], // Blue -> Blue-300
                ['#2c244c', '#64748b'], // Dark Purple -> Slate-500
                ['#be185d', '#f472b6'], // Pink -> Pink-400
                ['#e11d48', '#fb7185'], // Rose -> Rose-400
                ['#ea580c', '#fdba74'], // Burnt Orange -> Orange-300
                ['#7c3aed', '#c4b5fd'], // Purple -> Purple-300
                ['#4f46e5', '#818cf8'], // Indigo-Blue -> Indigo-400
                ['#db2777', '#f9a8d4'], // Pink-Magenta -> Pink-300
                ['#9333ea', '#d8b4fe'], // Purple-Violet -> Purple-300
            ];

            const traverse = (node: any, parentId: string | null = null, x: number = 0, y: number = 0, color: string = '#64748b', gradient: string[] | undefined = undefined) => {
                const id = uuidv4();

                // Root node styling
                let nodeColor = color;
                let nodeGradient = gradient;

                if (!parentId) {
                    nodeColor = '#64748b'; // Root default
                    nodeGradient = undefined;
                }

                newNodes.push({
                    id,
                    type: 'mindMap',
                    data: {
                        label: node.label || 'Node',
                        style: {
                            stroke: nodeColor,
                            gradient: nodeGradient
                        }
                    },
                    position: { x, y }
                });

                if (parentId) {
                    newEdges.push({
                        id: `e${parentId}-${id}`,
                        source: parentId,
                        target: id,
                        type: 'default',
                        style: {
                            stroke: nodeColor,
                            strokeWidth: 2
                        },
                    });
                }

                if (node.children && Array.isArray(node.children)) {
                    node.children.forEach((child: any, index: number) => {
                        let childColor = nodeColor;
                        let childGradient = nodeGradient;

                        if (!parentId) {
                            const grad = BRANCH_COLORS[index % BRANCH_COLORS.length];
                            if (Array.isArray(grad)) {
                                childColor = grad[0];
                                childGradient = grad;
                            } else {
                                childColor = grad;
                                childGradient = undefined;
                            }
                        } else {
                            // Simple cycle
                            const grad = BRANCH_COLORS[(index) % BRANCH_COLORS.length];
                            if (Array.isArray(grad)) {
                                childColor = grad[0];
                                childGradient = grad;
                            } else {
                                childColor = grad;
                                childGradient = undefined;
                            }
                        }

                        traverse(child, id, x + 250, y + (index * 80), childColor, childGradient);
                    });
                }
            };

            if (data.root) {
                traverse(data.root);
            }

            setNodes(newNodes);
            setEdges(newEdges);

            setTimeout(() => {
                layoutNodes();
            }, 100);

            setIsAIOpen(false);
            toast.success('Mind map generated!');
        } catch (error) {
            toast.error('Failed to generate mind map');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddImage = () => {
        const url = prompt("Enter Image URL:");
        if (!url) return;

        const nodes = getNodes();
        const selectedNode = nodes.find((n) => n.selected);

        if (selectedNode) {
            setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, image: url } } : n));
            setTimeout(() => layoutNodes(), 50);
        } else {
            toast.info("Select a node to add an image to.");
        }
    };

    return (
        <div className="absolute top-4 left-4 z-10 flex gap-3 items-start">
            <div className="flex flex-col gap-1">
                <Input
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="h-10 text-2xl font-bold border-transparent bg-transparent hover:border-slate-300 focus:border-slate-400 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 px-2 w-[400px]"
                    placeholder="Untitled"
                />
                <div className="flex items-center gap-2 px-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        {isSaving ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                            </>
                        ) : lastSaved ? (
                            <>
                                <Cloud className="h-3 w-3" /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </>
                        ) : (
                            <>
                                <Cloud className="h-3 w-3" /> Not saved
                            </>
                        )}
                    </span>
                </div>
            </div>

            <div className="flex gap-1 bg-white p-1.5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-slate-200/80">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => undo()}
                                disabled={!hasPast}
                                className="text-slate-600 hover:text-slate-900"
                            >
                                <Undo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => redo()}
                                disabled={!hasFuture}
                                className="text-slate-600 hover:text-slate-900"
                            >
                                <Redo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redo</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-8 bg-slate-200 mx-1" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={onSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save Manually</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleAddImage}>
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add Image to Node</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={layoutNodes}>
                                <Layout className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Auto Layout</TooltipContent>
                    </Tooltip>

                    <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100">
                                        <Sparkles className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Generate with AI</TooltipContent>
                        </Tooltip>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Generate with AI</DialogTitle>
                            </DialogHeader>
                            <div className="flex gap-2 mt-4">
                                <Input
                                    placeholder="Enter a topic (e.g. 'Project Management Flow')"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                                <Button onClick={handleGenerate} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleDeleteSelected} className="hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Selected</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-8 bg-slate-200 mx-1" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={onExport}>
                                <Download className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export as PDF</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}

import { Button } from '@/components/ui/button';
import { Download, Save, Sparkles, Plus, Layout, Trash2, Image as ImageIcon } from 'lucide-react';
import useMindMapStore from './store';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { generateMindMapFromAI } from '@/actions/mind-map';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useReactFlow } from '@xyflow/react';

interface MindMapToolbarProps {
    onSave: () => void;
    onExport: () => void;
    isSaving: boolean;
    title: string;
    onTitleChange: (title: string) => void;
}

export default function MindMapToolbar({ onSave, onExport, isSaving, title, onTitleChange }: MindMapToolbarProps) {
    const layoutNodes = useMindMapStore((state) => state.layoutNodes);
    const setNodes = useMindMapStore((state) => state.setNodes);
    const setEdges = useMindMapStore((state) => state.setEdges);
    const { getNodes, getEdges, deleteElements } = useReactFlow();

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
            // This requires a helper function to traverse the tree and create nodes
            const newNodes: any[] = [];
            const newEdges: any[] = [];

            const traverse = (node: any, parentId: string | null = null, x: number = 0, y: number = 0) => {
                const id = uuidv4();
                newNodes.push({
                    id,
                    type: 'mindMap', // Default to our custom node
                    data: { label: node.label || 'Node' },
                    position: { x, y }
                });

                if (parentId) {
                    newEdges.push({
                        id: `e${parentId}-${id}`,
                        source: parentId,
                        target: id,
                    });
                }

                if (node.children && Array.isArray(node.children)) {
                    node.children.forEach((child: any, index: number) => {
                        traverse(child, id, x + 200, y + (index * 100)); // Rough initial position
                    });
                }
            };

            if (data.root) {
                traverse(data.root);
            }

            setNodes(newNodes);
            setEdges(newEdges);

            // Run layout after a brief delay to ensure nodes are added
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
            // Update selected node with image
            setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, image: url } } : n));
            setTimeout(() => layoutNodes(), 50); // Reflow
        } else {
            toast.info("Select a node to add an image to.");
        }
    };

    return (
        <div className="absolute top-4 left-4 z-10 flex gap-4 items-start">
            <div className="flex flex-col gap-1">
                <Input
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="h-10 text-2xl font-bold border-transparent bg-transparent hover:border-slate-300 focus:border-slate-400 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 px-2 w-[400px]"
                    placeholder="Untitled"
                />
            </div>

            <div className="flex gap-1 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={onSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save Mind Map</TooltipContent>
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
                        <TooltipContent>Export as Image</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}

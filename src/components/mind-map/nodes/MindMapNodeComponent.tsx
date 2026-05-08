
import React, { memo, useEffect, useRef, useState } from 'react'; // Rebuild trigger fix
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Plus, Image as ImageIcon, Loader2, Upload, Link as LinkIcon, Sparkles } from 'lucide-react';
import useMindMapStore from '../store';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// We can use a unified node type
const MindMapNode = ({ id, data, isConnectable, selected }: NodeProps) => {
    const addChildNode = useMindMapStore((state) => state.addChildNode);
    const toggleNode = useMindMapStore((state) => state.toggleNode);
    const updateNodeLabel = useMindMapStore((state) => state.updateNodeLabel);
    const updateNodeData = useMindMapStore((state) => state.updateNodeData);
    const hasChildren = useMindMapStore((state) => state.edges.some((e) => e.source === id));

    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState((data.label as string) || 'Node');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Image handling states
    const [imageUrl, setImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingFn, setIsGeneratingFn] = useState(false); // Creating a local state for AI loading

    // Sync local label with prop data if it changes externally
    useEffect(() => {
        setLabel((data.label as string) || 'Node');
    }, [data.label]);

    // Auto-resize textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [label, isEditing]);

    const onAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        addChildNode(id);
    };

    const onToggleClick = () => {
        toggleNode(id);
    };

    const onLabelChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLabel(e.target.value);
    };

    const onBlur = () => {
        setIsEditing(false);
        updateNodeLabel(id, label);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            setIsEditing(false);
            updateNodeLabel(id, label);
        }
    };

    // Image Handlers
    const handleUrlSubmit = () => {
        if (!imageUrl) return;
        updateNodeData(id, {
            image: imageUrl,
            style: { ...(data.style as object || {}) } // Remove fixed width/height forcing
        });
        toast.success("Image updated from URL");
        setImageUrl('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use the existing API route
            await fetch('/app/api/upload/bunny?folder=mindmap', {
                method: 'POST', // The route might be at /api/upload/bunny directly or similar. Checking file path...
                // The file path viewed was src/app/api/upload/bunny/route.ts -> so /api/upload/bunny
                body: formData
            });

            // Correction: The viewed file path was src/app/api/upload/bunny/route.ts
            // So the endpoint is /api/upload/bunny

            // Actually let's try calling the route directly.
            const uploadRes = await fetch('/api/upload/bunny?folder=mindmap', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');

            const data = await uploadRes.json();
            if (data.url) {
                updateNodeData(id, {
                    image: data.url,
                    style: { ...(data.style as object || {}) }
                });
                toast.success("Image uploaded successfully");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt) return;

        setIsGeneratingFn(true); // Start loading

        try {
            const response = await fetch('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate image');
            }

            const data = await response.json();

            if (data.url) {
                updateNodeData(id, {
                    image: data.url,
                    style: { ...(data.style as object || {}) }
                });
                toast.success("Image generated!");
                setAiPrompt('');
            }
        } catch (error: any) {
            console.error("AI Generation Failed:", error);
            toast.error(error.message || "Failed to generate image");
        } finally {
            setIsGeneratingFn(false); // Stop loading
        }
    };

    const isCollapsed = !!data.collapsed;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeColor = (data.style as any)?.stroke || '#e2e8f0';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeGradient = (data.style as any)?.gradient as string[] | undefined;

    // Calculate resolved dimensions
    const resolvedWidth = (data.style as any)?.width ?? (data.image ? 300 : undefined);
    const resolvedHeight = (data.style as any)?.height ?? (data.image ? 200 : undefined);
    const hasExplicitSize = resolvedWidth !== undefined || resolvedHeight !== undefined;

    // Compute dynamic font size based on node dimensions AND text length
    // We want to fill the area roughly.
    // Base factor derived from area, scaled down by text length.
    // Use stored font size or default to 14px
    const fontSize = (data.style as any)?.fontSize ?? 14;

    return (
        <div
            className={cn("relative group", !hasExplicitSize && "w-full h-full")}
            style={{
                width: resolvedWidth,
                height: resolvedHeight
            }}
        >
            <NodeResizer
                isVisible={selected}
                minWidth={100}
                minHeight={40}
                keepAspectRatio={false}
                handleStyle={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid pink' }}
                lineStyle={{ border: '1px solid green' }} // Debug line color
                onResize={(_, params) => {
                    const { width, height } = params;
                    // Directly update style to prevent desync
                    updateNodeData(id, { style: { ...(data.style as object || {}), width, height } });
                }}
            />

            <Handle
                type="target"
                position={Position.Left}
                isConnectable={true}
                className="w-3 h-3 bg-transparent border-none opacity-0 group-hover:opacity-100 transition-opacity z-50 absolute left-0 top-1/2 -translate-y-1/2"
                style={{ zIndex: 50 }}
            />

            <div
                className={cn(
                    "relative transition-all duration-200 flex flex-col items-center justify-center w-full h-full",
                    // Adjust container to just be the wrapper, styling moved to inner or handled via wrapper background
                    data.image ? "rounded-2xl" : "rounded-2xl",
                    selected ? "ring-2 ring-blue-500/20 shadow-md" : "shadow-sm hover:shadow-md",
                )}
                style={
                    nodeGradient
                        ? {
                            background: `linear-gradient(to right, ${nodeGradient[0]}, ${nodeGradient[1]})`,
                            padding: '2px',
                        }
                        : {
                            backgroundColor: nodeColor,
                            padding: '2px',
                        }
                }
            >
                {/* Inner Content with White Background */}
                <div className={cn(
                    "w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden",
                    data.image ? "rounded-2xl p-2" : "rounded-2xl px-4 py-3" // Increased vertical padding
                )}>

                    {/* Node Toolbar for Quick Actions */}
                    <div className={cn(
                        "absolute -top-10 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-slate-100 p-1 flex gap-1 transition-all duration-200 z-50",
                        selected ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none translate-y-2"
                    )}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                            onClick={onAddClick}
                            title="Add Child"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Button>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-full"
                                    title="Add Link"
                                >
                                    <LinkIcon className="h-3.5 w-3.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-3" align="center" side="top">
                                <div className="space-y-2">
                                    <Label htmlFor="node-link" className="text-xs font-semibold">Hyperlink</Label>
                                    <div className="flex gap-1">
                                        <Input
                                            id="node-link"
                                            placeholder="https://..."
                                            value={data.link as string || ''}
                                            onChange={(e) => updateNodeData(id, { link: e.target.value })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">Enter a URL to make this node clickable in PDF.</p>
                                </div>
                            </PopoverContent>
                        </Popover>



                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-full"
                                    title="Add Image"
                                >
                                    <ImageIcon className="h-3.5 w-3.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="center" side="top">
                                <Tabs defaultValue="url" className="w-full">
                                    <TabsList className="w-full grid grid-cols-3 rounded-t-lg rounded-b-none p-0 h-10">
                                        <TabsTrigger value="url" className="rounded-none rounded-tl-lg data-[state=active]:bg-white">
                                            <LinkIcon className="h-3.5 w-3.5 mr-2" /> URL
                                        </TabsTrigger>
                                        <TabsTrigger value="upload" className="rounded-none data-[state=active]:bg-white">
                                            <Upload className="h-3.5 w-3.5 mr-2" /> Upload
                                        </TabsTrigger>
                                        <TabsTrigger value="ai" className="rounded-none rounded-tr-lg data-[state=active]:bg-white">
                                            <Sparkles className="h-3.5 w-3.5 mr-2" /> AI
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="p-4 bg-white/5">
                                        <TabsContent value="url" className="mt-0 space-y-3">
                                            <div className="space-y-1">
                                                <Label htmlFor="img-url" className="text-xs">Image URL</Label>
                                                <Input
                                                    id="img-url"
                                                    placeholder="https://example.com/image.png"
                                                    value={imageUrl}
                                                    onChange={(e) => setImageUrl(e.target.value)}
                                                />
                                            </div>
                                            <Button size="sm" className="w-full" onClick={handleUrlSubmit}>
                                                Set Image
                                            </Button>
                                        </TabsContent>

                                        <TabsContent value="upload" className="mt-0 space-y-3">
                                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                                <Label htmlFor="picture" className="text-xs">Upload from device</Label>
                                                <Input
                                                    id="picture"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    disabled={isUploading}
                                                />
                                            </div>
                                            {isUploading && (
                                                <div className="text-xs text-center text-slate-500 flex items-center justify-center gap-2">
                                                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="ai" className="mt-0 space-y-3">
                                            <div className="space-y-1">
                                                <Label htmlFor="ai-prompt" className="text-xs">Prompt</Label>
                                                <Input
                                                    id="ai-prompt"
                                                    placeholder="e.g. A futuristic city..."
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                />
                                            </div>
                                            <Button size="sm" className="w-full" onClick={handleAiGenerate} disabled={isGeneratingFn}>
                                                {isGeneratingFn ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Generating...</> : "Generate"}
                                            </Button>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </PopoverContent>
                        </Popover>

                        {/* Font Size Controls */}
                        <div className="flex items-center gap-0.5 bg-slate-100 rounded-full px-1.5 h-7">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 rounded-full hover:bg-white text-slate-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newSize = Math.max(10, fontSize - 2);
                                    updateNodeData(id, { style: { ...(data.style as object || {}), fontSize: newSize } });
                                }}
                                title="Decrease Font Size"
                            >
                                <span className="text-[10px] font-bold">A-</span>
                            </Button>
                            <span className="text-[10px] text-slate-500 w-4 text-center select-none">{fontSize}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 rounded-full hover:bg-white text-slate-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newSize = Math.min(60, fontSize + 2);
                                    updateNodeData(id, { style: { ...(data.style as object || {}), fontSize: newSize } });
                                }}
                                title="Increase Font Size"
                            >
                                <span className="text-[10px] font-bold">A+</span>
                            </Button>
                        </div>
                    </div>

                    {!!data.image && (
                        <div className="mb-2 rounded-lg overflow-hidden shadow-sm w-full relative group/image bg-slate-100/50 flex-1 min-h-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={data.image as string}
                                alt="Node attachment"
                                className="w-full h-full object-cover block rounded-lg pointer-events-none"
                            />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-full shadow-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateNodeData(id, { image: undefined });
                                }}
                            >
                                <span className="text-xs">×</span>
                            </Button>
                        </div>
                    )}

                    <div className="w-full flex-1 min-h-0 flex items-center justify-center relative z-10 px-2">
                        {isEditing ? (
                            <textarea
                                ref={textareaRef}
                                value={label}
                                onChange={onLabelChange}
                                onBlur={onBlur}
                                onKeyDown={onKeyDown}
                                className="nodrag w-full resize-none bg-transparent text-slate-800 text-center focus:outline-none placeholder:text-slate-400 font-medium leading-relaxed"
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: 1.4,
                                    overflow: 'hidden',
                                    height: '100%', // Fill the container
                                }}
                                rows={1}
                                autoFocus
                            />
                        ) : (
                            <div
                                className="font-medium text-slate-800 text-center cursor-text w-full break-words whitespace-pre-wrap selection:bg-blue-100 flex flex-col items-center justify-center gap-0.5 max-h-full no-scrollbar"
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: 1.4,
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    overflowY: 'auto', // Allow scrolling if text is too long even at min font size
                                    scrollbarWidth: 'none', // Hide scrollbar for cleaner look (Firefox)
                                    msOverflowStyle: 'none', // Hide scrollbar (IE/Edge)
                                }}
                                onDoubleClick={() => setIsEditing(true)}
                            >
                                {label}
                                {!!data.link && (
                                    <a
                                        href={(() => {
                                            const link = data.link as string;
                                            return link.startsWith('http') ? link : `https://${link}`;
                                        })()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 hover:bg-red-100 hover:text-red-700 flex items-center gap-1 mt-2 pointer-events-auto transition-colors font-semibold"
                                        style={{ fontSize: `${Math.max(16, fontSize * 1.05)}px` }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <LinkIcon className="w-[1em] h-[1em]" />
                                        <span className="max-w-[100px] truncate">Link</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Expand/Collapse Button - Positioned further down and detached from the node line */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasChildren) onToggleClick();
                        }}
                        className={cn(
                            "absolute -bottom-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center z-50 transition-all",
                            hasChildren ? "cursor-pointer hover:scale-110" : "cursor-default opacity-50",
                            (isCollapsed && hasChildren)
                                ? "text-blue-600 bg-blue-50 border-blue-200"
                                : "text-slate-400 hover:text-blue-500 hover:border-blue-200"
                        )}
                        title={hasChildren ? (isCollapsed ? "Expand" : "Collapse") : "No children"}
                    >
                        {(isCollapsed && hasChildren) ? (
                            <span className="text-[10px] font-bold leading-none">+</span>
                        ) : (
                            <span className="text-[10px] font-bold leading-none">−</span>
                        )}
                    </button>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={true}
                className="w-3 h-3 bg-transparent border-none opacity-0 group-hover:opacity-100 transition-opacity z-50 absolute right-0 top-1/2 -translate-y-1/2"
                style={{ zIndex: 50 }}
            />
        </div >
    );
};

export default memo(MindMapNode);

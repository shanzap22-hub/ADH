
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Type } from 'lucide-react';
import useMindMapStore from '../store';
import { cn } from '@/lib/utils';

// We can use a unified node type
const MindMapNode = ({ id, data, isConnectable, selected }: NodeProps) => {
    const addChildNode = useMindMapStore((state) => state.addChildNode);
    const toggleNode = useMindMapStore((state) => state.toggleNode);
    const updateNodeLabel = useMindMapStore((state) => state.updateNodeLabel);

    const [isEditing, setIsEditing] = React.useState(false);
    const [label, setLabel] = React.useState((data.label as string) || 'Node');

    const onAddClick = () => {
        addChildNode(id);
    };

    const onToggleClick = () => {
        toggleNode(id);
    };

    const onLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    const onBlur = () => {
        setIsEditing(false);
        updateNodeLabel(id, label);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            updateNodeLabel(id, label);
        }
    };

    const isCollapsed = !!data.collapsed;

    return (
        <div className="relative group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-slate-400"
            />

            <div
                className={cn(
                    "relative px-6 py-3 rounded-xl shadow-lg bg-white border-2 min-w-[150px] transition-all duration-200",
                    selected ? "border-blue-500 shadow-xl ring-2 ring-blue-200" : "border-slate-200 hover:border-slate-300"
                )}
            >
                {/* Node Toolbar for Quick Actions (Miro-like) */}
                <div className={cn(
                    "absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 p-1 flex gap-1 transition-opacity duration-200",
                    selected ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}>
                    {/* Toolbar Actions */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:bg-slate-100"
                        onClick={onAddClick}
                        title="Add Child"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>

                </div>

                {data.image && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                        <img src={data.image as string} alt="Node attachment" className="w-full h-auto object-cover max-h-[200px]" />
                    </div>
                )}

                <div className="flex items-center justify-center">
                    {isEditing ? (
                        <Input
                            value={label}
                            onChange={onLabelChange}
                            onBlur={onBlur}
                            onKeyDown={onKeyDown}
                            className="h-7 text-sm text-slate-900 bg-white text-center min-w-[100px]"
                            autoFocus
                        />
                    ) : (
                        <div
                            className="text-sm font-medium text-slate-800 text-center cursor-text min-h-[1.5em] w-full"
                            onDoubleClick={() => setIsEditing(true)}
                        >
                            {label}
                        </div>
                    )}
                </div>

                {/* Expand/Collapse Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleClick();
                    }}
                    className={cn(
                        "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-50 hover:border-slate-400 z-50 shadow-sm",
                        isCollapsed ? "bg-slate-100" : ""
                    )}
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? (
                        <span className="text-xs font-bold text-slate-600">+</span>
                    ) : (
                        <span className="text-xs font-bold text-slate-600">−</span>
                    )}
                </button>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-slate-400"
            />
        </div>
    );
};

export default memo(MindMapNode);

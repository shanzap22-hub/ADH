
import {
    BaseEdge,
    EdgeProps,
    getSmoothStepPath,
    useInternalNode,
} from '@xyflow/react';

export default function GradientEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected, // Add selected prop
}: EdgeProps) {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Default colors if no gradient data is provided
    const gradientColors = (data?.gradient as string[]) || ['#94a3b8', '#94a3b8'];
    const startColor = gradientColors[0];
    const endColor = gradientColors[1] || startColor;

    const gradientId = `gradient-${id}`;

    return (
        <>
            <defs>
                <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
                    <stop offset="0%" stopColor={startColor} />
                    <stop offset="100%" stopColor={endColor} />
                </linearGradient>
            </defs>
            {/* Invisible path for easier selection */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    strokeWidth: 20,
                    stroke: 'transparent',
                    cursor: 'pointer',
                }}
            />
            {/* Main Gradient Edge */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: `url(#${gradientId})`,
                    strokeWidth: selected ? 4 : 3, // Thicker when selected
                    filter: selected ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none', // Glow when selected
                }}
            />
        </>
    );
}

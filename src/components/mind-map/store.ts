import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    getOutgoers,
} from '@xyflow/react';
import dagre from 'dagre';
import { v4 as uuidv4 } from 'uuid';

export type RFState = {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    addNode: (node: Node) => void;
    layoutNodes: () => void;
    toggleNode: (nodeId: string) => void;
    updateNodeLabel: (nodeId: string, label: string) => void;
    updateNodeData: (nodeId: string, data: any) => void;
    addChildNode: (parentId: string, label?: string) => void;
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'LR' });

    nodes.forEach((node) => {
        // dagre requires width and height to calculate layout
        // we use some default values if they are not yet measured
        dagreGraph.setNode(node.id, { width: node.measured?.width ?? 150, height: node.measured?.height ?? 50 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - (node.measured?.width ?? 150) / 2,
                y: nodeWithPosition.y - (node.measured?.height ?? 50) / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

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

// Recursive function to hide/show children
const updateHiddenStatus = (nodeId: string, hidden: boolean, nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[] } => {
    let newNodes = [...nodes];
    let newEdges = [...edges];

    const childrenEdges = edges.filter((edge) => edge.source === nodeId);
    const childrenIds = childrenEdges.map((edge) => edge.target);

    childrenIds.forEach((childId) => {
        newNodes = newNodes.map((node) => {
            if (node.id === childId) {
                return { ...node, hidden };
            }
            return node;
        });

        // Hide edges connecting to hidden nodes
        newEdges = newEdges.map((edge) => {
            if (edge.target === childId || edge.source === childId) {
                return { ...edge, hidden };
            }
            return edge;
        });

        if (hidden) {
            // Recursively hide descendants
            const result = updateHiddenStatus(childId, true, newNodes, newEdges);
            newNodes = result.nodes;
            newEdges = result.edges;
        } else {
            // When unhiding, we only unhide direct children? Or should we restore state?
            // For simplicity, let's unhide recursively for now, or check a 'collapsed' flag.
            // But the prompt asked for "Collapsible branches".
            // If we unhide, we should check if the child itself was collapsed.
            // For now, let's just propagate the hidden status.
            const result = updateHiddenStatus(childId, false, newNodes, newEdges); // This would expand everything.
            // To properly handle "remembering" collapse state, we need extra data on nodes.
            // Let's assume simpler "expand all" behavior for MVP or refine logic if needed.
            // Actually, the requirements said "toggle button to hide or show its child nodes".
            // When showing, it should probably show the immediate children.
        }
    });

    return { nodes: newNodes, edges: newEdges };
};


// Better approach for toggle implementation with recursion support only for hiding.
// For showing, we only show immediate children if we want to preserve their own collapsed state?
// Let's implement a simple "toggle children" logic.

const toggleChildren = (nodeId: string, isHidden: boolean, nodes: Node[], edges: Edge[]) => {
    let newNodes = [...nodes];
    let newEdges = [...edges];

    const children = edges.filter((e) => e.source === nodeId).map((e) => e.target);

    children.forEach((childId) => {
        const childNode = newNodes.find((n) => n.id === childId);
        if (childNode) {
            // If we are hiding, we hide the child AND its descendants
            if (isHidden) {
                newNodes = newNodes.map((n) => n.id === childId ? { ...n, hidden: true } : n);
                newEdges = newEdges.map((e) => (e.source === childId || e.target === childId) ? { ...e, hidden: true } : e);
                const res = toggleChildren(childId, true, newNodes, newEdges);
                newNodes = res.nodes;
                newEdges = res.edges;
            } else {
                // If we are showing, we show the child.
                newNodes = newNodes.map((n) => n.id === childId ? { ...n, hidden: false } : n);
                newEdges = newEdges.map((e) => (e.source === childId || e.target === childId) ? { ...e, hidden: false } : e);

                // However, if this child was previously collapsed, we shouldn't expand its children.
                // We need a 'data.collapsed' field.
                if (!childNode.data.collapsed) {
                    // If it wasn't collapsed, we recursively show its children
                    const res = toggleChildren(childId, false, newNodes, newEdges);
                    newNodes = res.nodes;
                    newEdges = res.edges;
                }
            }
        }
    });

    return { nodes: newNodes, edges: newEdges };
};


const useMindMapStore = create<RFState>()(temporal((set, get) => ({
    nodes: [],
    edges: [],
    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },
    setNodes: (nodes: Node[]) => {
        set({ nodes });
    },
    setEdges: (edges: Edge[]) => {
        set({ edges });
    },
    addNode: (node: Node) => {
        set({ nodes: [...get().nodes, node] });
    },
    updateNodeLabel: (nodeId: string, label: string) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === nodeId) {
                    // it's important to create a new object here, to notify react flow about the change
                    return { ...node, data: { ...node.data, label } };
                }
                return node;
            }),
        });
    },
    updateNodeData: (nodeId: string, data: any) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, ...data } };
                }
                return node;
            }),
        });
    },



    addChildNode: (parentId: string, label: string = 'New Node') => {
        const parentNode = get().nodes.find(n => n.id === parentId);
        if (!parentNode) return;

        // Determine if parent is root (has no incoming edges)
        const isRoot = !get().edges.some(e => e.target === parentId);

        // Determine color/gradient
        let nodeColor = '#94a3b8'; // default slate-400
        let nodeGradient: string[] | undefined;

        if (isRoot) {
            // New main branch - pick next gradient based on existing branches
            const existingBranches = get().edges.filter(e => e.source === parentId).length;
            const gradient = BRANCH_COLORS[existingBranches % BRANCH_COLORS.length];
            if (Array.isArray(gradient)) {
                nodeColor = gradient[0];
                nodeGradient = gradient;
            } else {
                nodeColor = gradient as string;
            }
        } else {
            // Sub-branch - cycle distinct gradients

            // 1. Find the parent's primary color
            const parentStroke = (parentNode.data?.style as any)?.stroke;

            // 2. Find which gradient this color belongs to
            const parentGradientIndex = BRANCH_COLORS.findIndex(g => Array.isArray(g) ? g[0] === parentStroke : g === parentStroke);

            if (parentGradientIndex !== -1) {
                // 3. Pick the next gradient in the sequence
                const existingSiblings = get().edges.filter(e => e.source === parentId).length;

                // Calculate new index: Parent Index + 1 + Sibling Index
                const nextColorIndex = (parentGradientIndex + 1 + existingSiblings) % BRANCH_COLORS.length;

                const gradient = BRANCH_COLORS[nextColorIndex];
                if (Array.isArray(gradient)) {
                    nodeColor = gradient[0];
                    nodeGradient = gradient;
                } else {
                    nodeColor = gradient as string;
                }
            } else {
                // Fallback
                const existingSiblings = get().edges.filter(e => e.source === parentId).length;
                const gradient = BRANCH_COLORS[existingSiblings % BRANCH_COLORS.length];
                if (Array.isArray(gradient)) {
                    nodeColor = gradient[0];
                    nodeGradient = gradient;
                } else {
                    nodeColor = gradient as string;
                }
            }
        }

        const existingChildren = get().edges
            .filter(e => e.source === parentId)
            .map(e => get().nodes.find(n => n.id === e.target))
            .filter((n): n is Node => !!n)
            .sort((a, b) => a.position.y - b.position.y);

        let newY = parentNode.position.y;
        if (existingChildren.length > 0) {
            const lastChild = existingChildren[existingChildren.length - 1];
            // Place below the last child with some spacing
            newY = lastChild.position.y + (lastChild.measured?.height || 60) + 20;
        }

        const newNodeId = uuidv4();
        const newNode: Node = {
            id: newNodeId,
            type: 'mindMap',
            data: {
                label: label,
                style: {
                    stroke: nodeColor,
                    gradient: nodeGradient
                }
            },
            position: {
                x: parentNode.position.x + 300, // Fixed horizontal spacing
                y: newY
            }
        };

        const newEdge: Edge = {
            id: `e${parentId}-${newNodeId}`,
            source: parentNode.id,
            target: newNodeId,
            type: 'default',
            data: {
                gradient: nodeGradient ? nodeGradient : [nodeColor, nodeColor]
            },
            style: {
                stroke: nodeColor,
                strokeWidth: 2
            },
        };

        set({
            nodes: [...get().nodes, newNode],
            edges: [...get().edges, newEdge]
        });

        // REMOVED: get().layoutNodes(); 
        // We do NOT want to trigger a global re-layout, effectively "pinning" old nodes.
    },
    layoutNodes: () => {
        const { nodes, edges } = getLayoutedElements(get().nodes, get().edges);
        set({ nodes, edges });
    },
    toggleNode: (nodeId: string) => {
        const node = get().nodes.find(n => n.id === nodeId);
        if (!node) return;

        const isCollapsed = !!node.data.collapsed;
        const newCollapsedState = !isCollapsed;

        // Update the node's data to reflect collapsed state
        set({
            nodes: get().nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, collapsed: newCollapsedState } } : n)
        });

        // Calculate visibility
        const { nodes, edges } = toggleChildren(nodeId, newCollapsedState, get().nodes, get().edges);

        set({ nodes, edges });
        // Removed auto-layout to preserve manual node positioning
    }
}), {
    limit: 100, // Limit history to 100 steps
    partialize: (state) => {
        const { nodes, edges } = state;
        return { nodes, edges }; // Only track nodes and edges in history
    },
    equality: (pastState, currentState) => {
        // Simple equality check to avoid duplicate history entries if nothing changed
        return JSON.stringify(pastState) === JSON.stringify(currentState);
    }
}));

export const useTemporalStore = <T>(
    selector: (state: any) => T,
) => useStore(useMindMapStore.temporal, selector);

export default useMindMapStore;

import { create } from 'zustand';
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


const useMindMapStore = create<RFState>((set, get) => ({
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
                    node.data = { ...node.data, label };
                }
                return node;
            }),
        });
    },
    addChildNode: (parentId: string, label: string = 'New Node') => {
        const parentNode = get().nodes.find(n => n.id === parentId);
        if (!parentNode) return;

        const newNodeId = uuidv4();
        const newNode: Node = {
            id: newNodeId,
            type: 'mindMap',
            data: { label: label },
            position: {
                x: parentNode.position.x + 200,
                y: parentNode.position.y // dagre will fix this
            }
        };

        const newEdge: Edge = {
            id: `e${parentId}-${newNodeId}`,
            source: parentNode.id,
            target: newNodeId,
        };

        set({
            nodes: [...get().nodes, newNode],
            edges: [...get().edges, newEdge]
        });

        get().layoutNodes();
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
        setTimeout(() => {
            get().layoutNodes();
        }, 10);
    }

}));

export default useMindMapStore;

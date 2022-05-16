import * as React from 'react';
import { ConnectDropTarget } from 'react-dnd';
import { Edge, Node, ReactFlowInstance } from 'react-flow-renderer';

import { QueryDAGNodeTypes } from 'hooks/dag/useExporterDAG';
import { IDataDocDAGExport, IDataQueryCell } from 'const/datadoc';

import { DataDocDAGExporterSave } from './DataDocDAGExporter';
import { DataDocDagExporterList } from './DataDocDAGExporterList';
import { FlowGraph } from 'ui/FlowGraph/FlowGraph';
import { RemovableEdge } from 'ui/FlowGraph/RemovableEdge';

const edgeTypes = {
    removableEdge: RemovableEdge,
};

interface IProps {
    unusedQueryCells: IDataQueryCell[];
    dropRef: ConnectDropTarget;
    graphRef: React.MutableRefObject<HTMLDivElement>;
    nodes: Node[];
    edges: Edge[];
    setNodes: (value: React.SetStateAction<Node[]>) => void;
    setEdges: (value: React.SetStateAction<Edge[]>) => void;
    setGraphInstance: (graphIntstance: ReactFlowInstance<any, any>) => void;
    onSave: (nodes: Node[], edges: Edge[]) => Promise<IDataDocDAGExport>;
    onExport: () => void;
}

export const DataDocDAGExporterGraph = ({
    unusedQueryCells,
    dropRef,
    graphRef,
    nodes,
    edges,
    setNodes,
    setEdges,
    setGraphInstance,
    onSave,
    onExport,
}: IProps) => (
    <>
        <DataDocDagExporterList queryCells={unusedQueryCells} />
        <div className="DataDocDAGExporter-main">
            <div className="DataDocDAGExporter-graph-wrapper" ref={dropRef}>
                <div className="DataDocDAGExporterGraph">
                    <FlowGraph
                        isInteractive={true}
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        nodeTypes={QueryDAGNodeTypes}
                        edgeTypes={edgeTypes}
                        graphRef={graphRef}
                        setGraphInstance={setGraphInstance}
                    />
                </div>
                <DataDocDAGExporterSave
                    onSave={() => onSave(nodes, edges)}
                    onExport={onExport}
                />
            </div>
        </div>
    </>
);

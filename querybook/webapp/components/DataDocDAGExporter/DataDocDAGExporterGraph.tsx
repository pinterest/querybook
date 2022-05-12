import * as React from 'react';
import { ConnectDropTarget } from 'react-dnd';
import { Edge, Node } from 'react-flow-renderer';

import { QueryDAGNodeTypes } from 'hooks/dag/useExporterDAG';
import { IDataDocDAGExport, IDataQueryCell } from 'const/datadoc';

import { DataDocDAGExporterSave } from './DataDocDAGExporter';
import { DataDocDagExporterList } from './DataDocDAGExporterList';
import { FlowGraph } from 'ui/FlowGraph/FlowGraph';

interface IProps {
    unusedQueryCells: IDataQueryCell[];
    dropRef: ConnectDropTarget;
    nodes: Node[];
    edges: Edge[];
    setNodes: (value: React.SetStateAction<Node[]>) => void;
    setEdges: (value: React.SetStateAction<Edge[]>) => void;
    onSave: (nodes: Node[], edges: Edge[]) => Promise<IDataDocDAGExport>;
    onExport: () => void;
}

export const DataDocDAGExporterGraph = ({
    unusedQueryCells,
    dropRef,
    nodes,
    edges,
    setNodes,
    setEdges,
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

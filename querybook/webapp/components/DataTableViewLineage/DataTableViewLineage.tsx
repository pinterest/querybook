import React from 'react';
import { Edge, Node } from 'react-flow-renderer';

import { DataTableViewMini } from 'components/DataTableViewMini/DataTableViewMini';
import { IDataTable, ILineage, ILineageCollection } from 'const/metastore';
import { navigateWithinEnv } from 'lib/utils/query-string';
import {
    edgeStyle,
    FlowGraph,
    initialNodePosition,
} from 'ui/FlowGraph/FlowGraph';
import { LineageNode } from 'ui/FlowGraph/LineageNode';

import './DataTableViewLineage.scss';

export interface IDataTableViewLineageProps {
    dataLineageLoader: (tableId: number) => any;
    dataLineages: ILineageCollection;

    table: IDataTable;
}

function getFullLineage(
    lineages: Record<number, ILineage[]>,
    tableId: number,
    tableName: string,
    nodes: Node[],
    edges: Edge[],
    seen: Set<number>,
    addedTableIds: Set<number>,
    onSelect: (id: number) => void,
    onExpand: (id: number) => void,
    selectedTableId: number
) {
    if (seen.has(tableId)) {
        return;
    }
    seen.add(tableId);

    const indexNode = (tid, tName) => {
        if (!addedTableIds.has(tid)) {
            nodes.push({
                id: tid.toString(),
                type: 'lineageNode',
                data: {
                    label: tName,
                    onSelect: () => onSelect(tid),
                    onExpand: () => onExpand(tid),
                    isSelected: tid === selectedTableId,
                },
                position: initialNodePosition,
            });
            addedTableIds.add(tid);
        }
        return tid;
    };

    indexNode(tableId, tableName);

    if (tableId in lineages) {
        // Compute Edges
        const lineagesForTable = lineages[tableId];
        for (const lineage of lineagesForTable) {
            const {
                parent_table_id: sourceId,
                parent_name: parentName,
                table_id: targetId,
                table_name: lineageTableName,
            } = lineage;

            indexNode(sourceId, parentName);
            indexNode(targetId, lineageTableName);

            edges.push({
                id: targetId + ',' + sourceId,
                source: sourceId.toString(),
                target: targetId.toString(),
                animated: true,
                style: edgeStyle,
            });

            const nextTableId = sourceId === tableId ? targetId : sourceId;
            const nextTableName =
                sourceId === tableId ? lineageTableName : parentName;

            getFullLineage(
                lineages,
                nextTableId,
                nextTableName,
                nodes,
                edges,
                seen,
                addedTableIds,
                onSelect,
                onExpand,
                selectedTableId
            );
        }
    }
}

export const DataTableViewLineage: React.FunctionComponent<
    IDataTableViewLineageProps
> = ({ dataLineageLoader, dataLineages, table }) => {
    const [selectedTableId, setSelectedTableId] = React.useState<number>(null);

    const onNodeClick = React.useCallback((clickedNodeId: number) => {
        setSelectedTableId((currentSelectedNode) =>
            clickedNodeId !== currentSelectedNode ? clickedNodeId : null
        );
    }, []);

    const onNodeExpand = React.useCallback(
        (clickedNodeId: number) => {
            dataLineageLoader(clickedNodeId);
        },
        [dataLineageLoader]
    );

    const { nodes, edges } = React.useMemo(() => {
        const { id: tableId, name: tableName } = table;

        const newNodes = [];
        const newEdges = [];
        const seen = new Set<number>();
        const addedTableIds = new Set<number>();

        for (const lineages of Object.values(dataLineages)) {
            seen.delete(tableId);
            getFullLineage(
                lineages, // parentLineage, childLineage
                tableId,
                tableName,
                newNodes,
                newEdges,
                seen,
                addedTableIds,
                onNodeClick,
                onNodeExpand,
                selectedTableId
            );
        }

        return {
            nodes: newNodes,
            edges: newEdges,
        };
    }, [dataLineages, onNodeClick, onNodeExpand, selectedTableId, table]);

    React.useEffect(() => {
        dataLineageLoader(table.id);
        setSelectedTableId(table.id);
    }, [table]);

    const miniTableView = selectedTableId != null && (
        <DataTableViewMini
            onHide={() => setSelectedTableId(null)}
            tableId={selectedTableId}
            onViewDetails={(tableId) =>
                navigateWithinEnv(
                    `/table/${tableId}/`,
                    {
                        isModal: true,
                    },
                    true
                )
            }
        />
    );
    return (
        <div className="DataTableViewLineage flex-row">
            {miniTableView}
            <FlowGraph
                nodes={nodes}
                edges={edges}
                nodeTypes={LineageDAGNodeTypes}
                autoLayout
            />
        </div>
    );
};

const LineageDAGNodeTypes = { lineageNode: LineageNode };

import React from 'react';

import { ILineageCollection, IDataTable, ILineage } from 'const/metastore';

import './DataTableViewLineage.scss';
import { DAG, IDAGNode, IDAGEdge } from 'ui/DAG/DAG';
import { DataTableViewMini } from 'components/DataTableViewMini/DataTableViewMini';
import { navigateWithinEnv } from 'lib/utils/query-string';

export interface IDataTableViewLineageProps {
    dataLineageLoader: (tableId: number) => any;
    dataLineages: ILineageCollection;

    table: IDataTable;
}

function getFullLineage(
    lineages: Record<number, ILineage[]>,
    tableId: number,
    tableName: string,
    nodes: IDAGNode[],
    edges: IDAGEdge[],
    tableIdToNodeIndex: Record<number, number>,
    seen: Set<number>,
    level
) {
    if (seen.has(tableId)) {
        return;
    }
    seen.add(tableId);

    const getNodeIndex = (tid, tName) => {
        if (!(tid in tableIdToNodeIndex)) {
            nodes.push({
                id: tid,
                label: tName,
                rank: level,
            });
            tableIdToNodeIndex[tid] = nodes.length - 1;
        }
        return tableIdToNodeIndex[tid];
    };

    getNodeIndex(tableId, tableName);

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

            const source = getNodeIndex(sourceId, parentName);
            const target = getNodeIndex(targetId, lineageTableName);
            edges.push({
                source,
                target,
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
                tableIdToNodeIndex,
                seen,
                level + 1
            );
        }
    }
}

export const DataTableViewLineage: React.FunctionComponent<IDataTableViewLineageProps> = ({
    dataLineageLoader,
    dataLineages,
    table,
}) => {
    const [selectedTableId, setSelectedTableId] = React.useState<number>(null);
    const { nodes, edges } = React.useMemo(() => {
        const { id: tableId, name: tableName } = table;

        const newNodes = [];
        const tableIdToNodeIndex = {};
        const newEdges = [];
        const seen = new Set<number>();

        for (const lineages of Object.values(dataLineages)) {
            seen.delete(tableId);
            getFullLineage(
                lineages, // parentLineage, childLineage
                tableId,
                tableName,
                newNodes,
                newEdges,
                tableIdToNodeIndex,
                seen,
                0
            );
        }

        return {
            nodes: newNodes,
            edges: newEdges,
        };
    }, [dataLineages, table]);
    const focusNode = React.useMemo(
        () =>
            selectedTableId != null
                ? nodes.find((node) => node.id === selectedTableId)
                : null,
        [selectedTableId]
    );

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
        <div className="DataTableViewLineage">
            <DAG
                nodes={nodes}
                edges={edges}
                focusNode={focusNode}
                onNodeClicked={(_node, d3) => {
                    const node = (_node as unknown) as IDAGNode;
                    const newTableId = Number(node.id);
                    const prevSelectedNode =
                        selectedTableId && d3.select(`#node${selectedTableId}`);
                    const currentSelectedNode = d3.select(`#node${node.id}`);
                    if (prevSelectedNode) {
                        // undo focus
                        prevSelectedNode
                            .select('rect')
                            .style('fill', 'var(--bg-light)');
                    }

                    if (newTableId !== selectedTableId) {
                        currentSelectedNode
                            .select('rect')
                            .style('fill', 'var(--color-accent-lightest)');

                        dataLineageLoader(newTableId);
                        setSelectedTableId(newTableId);
                    } else {
                        setSelectedTableId(null);
                    }
                }}
                customNodeRender={(node) => {
                    const selected = node.id === selectedTableId;
                    const nodeColor = selected
                        ? 'var(--color-accent-lightest)'
                        : 'var(--bg-lightest)';

                    return {
                        rx: 5,
                        ry: 5,
                        fillColor: nodeColor,
                        style: `
                            fill: ${nodeColor};
                        `,
                        class: 'generic-node-class',
                    };
                }}
            />
            {miniTableView}
        </div>
    );
};

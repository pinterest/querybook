import React from 'react';
import * as d3 from 'd3';
import * as DagreD3 from 'dagre-d3';
import clsx from 'clsx';
import { uniqueId, debounce } from 'lodash';

import './DAG.scss';

export interface IDAGNode {
    id: number | string;
    label: string;
    rank?: number;
    color?: string;
    customClass?: string;
}

export interface IDAGEdge {
    source: number | string;
    target: number | string;
    label?: string;
}

interface IProps {
    className?: string;
    nodes: IDAGNode[];
    edges: IDAGEdge[];
    // If provided, zoom will zoom to this focusNode
    focusNode?: IDAGNode;
    customNodeRender?: (node: IDAGNode) => Record<string, unknown>;
    onNodeClicked?: (node: Record<string, unknown>, d3: any) => void;
    // Multi Graph allows multiple edges between same node pair
    // and edge lbaelling
    isMultiGraph?: boolean;
    rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
}

export const DAG: React.FunctionComponent<IProps> = ({
    className = '',
    nodes,
    edges,

    customNodeRender,
    onNodeClicked,
    focusNode,
    rankDir,
}) => {
    const [graphId, _] = React.useState(`${uniqueId('querybook-DAG-')}`);
    const [graph, setGraph] = React.useState<DagreD3.graphlib.Graph>(null);
    const [d3Zoom, setD3Zoom] = React.useState<
        d3.ZoomBehavior<Element, unknown>
    >(null);
    const [scale, setScale] = React.useState(1);
    const setScaleDebounced = debounce(setScale, 300);

    React.useEffect(() => {
        const g = new DagreD3.graphlib.Graph()
            .setGraph({
                rankdir: rankDir || 'LR',
            })
            .setDefaultEdgeLabel(() => ({}));

        for (const [index, node] of nodes.entries()) {
            const nodeColor = node.color || 'var(--icon-color)';
            g.setNode(String(index), {
                ...node,
                ...(customNodeRender
                    ? customNodeRender(node)
                    : {
                          rx: 5,
                          ry: 5,
                          fillColor: nodeColor,
                          borderColor: nodeColor,
                          style: `
                            fill: ${nodeColor};
                            stroke: ${nodeColor};`,
                          class: node.customClass || 'generic-node-class',
                      }),
            });
        }

        edges.forEach((edge) => {
            const { source, target, label } = edge;
            if (label) {
                g.setEdge(String(source), String(target), edge, label);
            } else {
                g.setEdge(String(source), String(target));
            }
        });

        const render = new DagreD3.render();

        const svg = d3.select(`#${graphId} svg`);
        const svgGroup = svg.append('g');
        render(d3.select(`#${graphId} svg g`) as any, g);
        // Give each node a unique id ('node' + node.id) for referencing
        svg.selectAll('g.node').attr('id', (__, idx) => `node${nodes[idx].id}`);
        // Rendering is now complete

        // setup zoom behavior
        const zoom = d3.zoom().on('zoom', () => {
            setScaleDebounced(d3.event.transform.k);
            svgGroup.attr('transform', d3.event.transform);
        });
        svg.call(zoom);
        // Center the graph, set the zoom to include the whole graph

        setGraph(g);
        // Zoom is a function, so wrap with () to prevent calling
        setD3Zoom(() => zoom);

        return () => {
            d3.select(`#${graphId} svg`).selectAll('*').remove();
        };
    }, [rankDir, nodes, edges]);

    // Zoom the graph to the focusNode
    React.useEffect(() => {
        if (graph && d3Zoom && focusNode) {
            const svg = d3.select(`#${graphId} svg`);
            const svgWidth = parseFloat(svg.style('width').slice(0, -2));
            const svgHeight = parseFloat(svg.style('height').slice(0, -2));
            const d3FocusNode = d3.select(`#node${focusNode.id}`);

            if (!d3FocusNode.empty()) {
                const transformString = d3FocusNode.attr('transform');
                const translation = transformString
                    .substring(
                        transformString.indexOf('(') + 1,
                        transformString.indexOf(')')
                    )
                    .split(',')
                    .map(Number);

                svg.transition()
                    .duration(750)
                    .call(
                        d3Zoom.transform as any,
                        d3.zoomIdentity
                            .translate(
                                -1 * translation[0] * scale + 0.5 * svgWidth,
                                -1 * translation[1] * scale + 0.5 * svgHeight
                            )
                            .scale(scale)
                    );
            }
        }
    }, [graph, d3Zoom, focusNode]);

    React.useEffect(() => {
        const svg = d3.select(`#${graphId} svg`);
        // Assign this to self is bad, but we need it in this case because d3 will assign the
        // clicked DOM element to `this`
        // Setup on click events
        svg.selectAll('g.node').on('click', (id) => {
            if (onNodeClicked) {
                onNodeClicked(graph.node(id), d3);
            }
        });
    }, [graph, onNodeClicked]);

    return (
        <div
            id={graphId}
            className={clsx({
                DAG: true,
                [className]: className,
            })}
        >
            <svg />
        </div>
    );
};

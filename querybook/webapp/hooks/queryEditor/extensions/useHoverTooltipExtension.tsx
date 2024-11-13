import {
    EditorView,
    hoverTooltip,
    HoverTooltipSource,
} from '@uiw/react-codemirror';
import React, { MutableRefObject, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { FunctionDocumentationTooltipByName } from 'components/CodeMirrorTooltip/FunctionDocumentationTooltip';
import { TableTooltipByName } from 'components/CodeMirrorTooltip/TableTooltip';
import { getTokenAtOffset, offsetToPos } from 'lib/codemirror/utils';
import { ICodeAnalysis, TableToken } from 'lib/sql-helper/sql-lexer';
import { reduxStore } from 'redux/store';

export const useHoverTooltipExtension = ({
    codeAnalysisRef,
    metastoreId,
}: {
    codeAnalysisRef: MutableRefObject<ICodeAnalysis>;
    metastoreId: number;
}) => {
    const getTableAtV5Position = useCallback(
        (codeAnalysis, v5Pos: { line: number; ch: number }) => {
            const { line, ch } = v5Pos;
            if (codeAnalysis) {
                const tableReferences: TableToken[] = [].concat.apply(
                    [],
                    Object.values(codeAnalysis.lineage.references)
                );

                return tableReferences.find((tableInfo) => {
                    if (tableInfo.line !== line) {
                        return false;
                    }
                    const isSchemaExplicit =
                        tableInfo.end - tableInfo.start > tableInfo.name.length;
                    const tablePos = {
                        from:
                            tableInfo.start +
                            (isSchemaExplicit ? tableInfo.schema.length : 0),
                        to: tableInfo.end,
                    };

                    return tablePos.from <= ch && tablePos.to >= ch;
                });
            }

            return null;
        },
        []
    );

    const getTableAtCursor = useCallback(
        (editorView: EditorView) => {
            const selection = editorView.state.selection.main;
            const v5Pos = offsetToPos(editorView, selection.from);
            return getTableAtV5Position(codeAnalysisRef.current, v5Pos);
        },
        [getTableAtV5Position]
    );

    const getHoverTooltips: HoverTooltipSource = useCallback(
        (view: EditorView, pos: number, side: -1 | 1) => {
            const v5Pos = offsetToPos(view, pos);
            const table = getTableAtV5Position(codeAnalysisRef.current, v5Pos);

            const token = getTokenAtOffset(view, pos);
            const nextChar = view.state.doc.sliceString(token.to, token.to + 1);

            let tooltipComponent = null;
            if (table) {
                tooltipComponent = (
                    <TableTooltipByName
                        metastoreId={metastoreId}
                        tableFullName={`${table.schema}.${table.name}`}
                        hidePinItButton={false}
                    />
                );
            } else if (nextChar === '(') {
                tooltipComponent = (
                    <FunctionDocumentationTooltipByName
                        language="sqlite"
                        functionName={token.text}
                    />
                );
            }

            if (!tooltipComponent) {
                return null;
            }

            return {
                pos: token.from,
                end: token.to,
                above: true,
                create: (view: EditorView) => {
                    const container = document.createElement('div');
                    ReactDOM.render(
                        <Provider store={reduxStore}>
                            {tooltipComponent}
                        </Provider>,
                        container
                    );

                    return { dom: container };
                },
            };
        },
        []
    );

    const extension = useMemo(
        () => hoverTooltip(getHoverTooltips, {}),
        [getHoverTooltips]
    );
    return { extension, getTableAtCursor };
};

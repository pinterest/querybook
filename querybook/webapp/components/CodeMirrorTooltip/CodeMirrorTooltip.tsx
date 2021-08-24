import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { IFunctionDescription } from 'const/metastore';
import { useEvent } from 'hooks/useEvent';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { IStoreState } from 'redux/store/types';
import * as dataSourcesActions from 'redux/dataSources/action';

import { FunctionDocumentationTooltip } from './FunctionDocumentationTooltip';
import { TableTooltip } from './TableTooltip';

import './CodeMirrorTooltip.scss';

export interface ICodeMirrorTooltipProps {
    tableId?: number;
    functionDocumentations?: IFunctionDescription[];
    error?: React.ReactChild;

    openTableModal?: () => any;
    hide: () => any;
}

export const CodeMirrorTooltip: React.FunctionComponent<ICodeMirrorTooltipProps> = ({
    tableId,
    hide,
    functionDocumentations,
    error,
    openTableModal,
}) => {
    const { table, schema, columns } = useShallowSelector(
        (state: IStoreState) => {
            const tableFromState = state.dataSources.dataTablesById[tableId];
            const schemaFromState = tableFromState
                ? state.dataSources.dataSchemasById[tableFromState.schema]
                : null;
            const columnsFromState = tableFromState
                ? (tableFromState.column || []).map(
                      (id) => state.dataSources.dataColumnsById[id]
                  )
                : [];

            return {
                table: tableFromState,
                schema: schemaFromState,
                columns: columnsFromState,
            };
        }
    );

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(dataSourcesActions.fetchDataTableIfNeeded(tableId));
    }, []);

    useEvent('keydown', (evt: KeyboardEvent) => {
        const specialKeyPress =
            evt.shiftKey || evt.metaKey || evt.ctrlKey || evt.altKey;
        if (!specialKeyPress) {
            hide();
        }
    });

    let contentDOM = null;
    if (tableId) {
        contentDOM = (
            <TableTooltip
                table={table}
                schema={schema}
                columns={columns}
                openTableModal={openTableModal}
            />
        );
    } else if (functionDocumentations) {
        contentDOM = (
            <FunctionDocumentationTooltip
                functionDocumentations={functionDocumentations}
            />
        );
    } else if (error) {
        contentDOM = (
            <div className="rich-text-content">
                <h3>Error</h3>
                <div>{error}</div>
            </div>
        );
    }

    return <div className="CodeMirrorTooltip">{contentDOM}</div>;
};

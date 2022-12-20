import Resizable from 're-resizable';
import React, { useEffect } from 'react';

import { DataTableNavigator } from 'components/DataTableNavigator/DataTableNavigator';
import { DataTableViewMini } from 'components/DataTableViewMini/DataTableViewMini';
import { useExactMatchTableId } from 'hooks/table/useExactMatchTableId';
import { enableResizable } from 'lib/utils';
import { getCurrentEnv } from 'lib/utils/query-string';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { Message } from 'ui/Message/Message';

import './DataDocSchemaNavigator.scss';

export const DataDocSchemaNavigator: React.FunctionComponent = () => {
    const [tableId, setTableId] = React.useState<number>(null);
    const exactMatchId = useExactMatchTableId();

    useEffect(() => {
        if (exactMatchId) {
            setTableId(exactMatchId);
        }
    }, [exactMatchId]);

    const schemaPanel = (
        <DataTableNavigator
            onTableRowClick={(id, e) => {
                if (e.metaKey || e.ctrlKey) {
                    window.open(`/${getCurrentEnv().name}/table/${id}/`);
                } else {
                    setTableId(tableId === id ? null : id);
                }
            }}
            selectedTableId={tableId}
        />
    );

    const tableViewDOM = tableId ? (
        <div className="DataTableViewMini-wrapper">
            {tableId === exactMatchId && (
                <div className="p8">
                    <Message type="success" size="small">
                        Exact table match found.
                    </Message>
                </div>
            )}

            <DataTableViewMini
                tableId={tableId}
                onHide={() => setTableId(null)}
            />
        </div>
    ) : null;

    const tableViewContainer = tableViewDOM && (
        <Resizable
            className="schema-info-panel"
            defaultSize={{
                width: '100%',
                height: '600px',
            }}
            enable={enableResizable({ top: true, bottom: true })}
        >
            {tableViewDOM}
        </Resizable>
    );

    const contentDOM = (
        <FullHeight flex="column" className="DataDocSchemaNavigator">
            {schemaPanel}
            {tableViewContainer}
        </FullHeight>
    );

    return contentDOM;
};

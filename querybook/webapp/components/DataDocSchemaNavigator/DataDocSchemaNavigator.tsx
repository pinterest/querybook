import Resizable from 're-resizable';
import React from 'react';

import { DataTableNavigator } from 'components/DataTableNavigator/DataTableNavigator';
import { DataTableViewMini } from 'components/DataTableViewMini/DataTableViewMini';
import { enableResizable } from 'lib/utils';
import { getCurrentEnv } from 'lib/utils/query-string';
import { FullHeight } from 'ui/FullHeight/FullHeight';

import './DataDocSchemaNavigator.scss';

export const DataDocSchemaNavigator: React.FunctionComponent = () => {
    const [tableId, setTableId] = React.useState<number>(null);

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
    const tableView = tableId && (
        <Resizable
            className="schema-info-panel"
            defaultSize={{
                width: '100%',
                height: '600px',
            }}
            enable={enableResizable({ top: true, bottom: true })}
            // minHeight={'200px'}
            // maxHeight={'900px'}
        >
            <DataTableViewMini
                tableId={tableId}
                onHide={() => setTableId(null)}
            />
        </Resizable>
    );

    const contentDOM = (
        <FullHeight flex="column" className="DataDocSchemaNavigator">
            {schemaPanel}
            {tableView}
        </FullHeight>
    );

    return contentDOM;
};

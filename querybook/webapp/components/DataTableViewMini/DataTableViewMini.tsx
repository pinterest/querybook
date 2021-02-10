import React from 'react';

import { navigateWithinEnv } from 'lib/utils/query-string';

import { ColumnPanelView } from './ColumnPanelView';
import { TablePanelView } from './TablePanelView';

import { TextButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { Level } from 'ui/Level/Level';

import './DataTableViewMini.scss';

interface IProps {
    tableId: number;
    onHide?: () => any;
    onViewDetails?: (tableId: number) => any;
}

export const DataTableViewMini: React.FunctionComponent<IProps> = ({
    tableId,
    onHide,
    onViewDetails,
}) => {
    const [columnId, setColumnId] = React.useState<number>(null);
    React.useEffect(() => {
        setColumnId(null);
    }, [tableId]);

    const showColumn = columnId != null;
    const infoContentDOM: React.ReactNode = showColumn ? (
        <ColumnPanelView columnId={columnId} />
    ) : (
        <TablePanelView
            columnId={columnId}
            tableId={tableId}
            onColumnRowClick={(id: number) => setColumnId(id)}
        />
    );

    const closeButton =
        showColumn || onHide ? (
            <IconButton
                icon={showColumn ? 'arrow-left' : 'x'}
                onClick={() => {
                    if (showColumn) {
                        setColumnId(null);
                    } else if (onHide) {
                        onHide();
                    }
                }}
            />
        ) : null;

    return (
        <div className="DataTableViewMini">
            <Level className="DataTableViewMini-header">
                {closeButton || <div />}
                <TextButton
                    onClick={() =>
                        onViewDetails
                            ? onViewDetails(tableId)
                            : navigateWithinEnv(`/table/${tableId}/`, {
                                  isModal: true,
                              })
                    }
                    title="View Table"
                    className="table-details-button"
                />
            </Level>
            <div className="DataTableViewMini-content">{infoContentDOM}</div>
        </div>
    );
};

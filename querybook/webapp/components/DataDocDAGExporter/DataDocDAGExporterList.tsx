import * as React from 'react';
import { useSelector } from 'react-redux';

import { IDataQueryCell } from 'const/datadoc';
import { IStoreState } from 'redux/store/types';

import { DataDocDAGExporterListItem } from './DataDocDAGExporterListItem';

import { EmptyText } from 'ui/StyledText/StyledText';

interface IProps {
    queryCells: IDataQueryCell[];
}

export const DataDocDagExporterList: React.FunctionComponent<IProps> = ({
    queryCells,
}) => {
    const queryEngineById = useSelector(
        (state: IStoreState) => state.queryEngine.queryEngineById
    );

    return (
        <div className="DataDocDAGExporterList">
            {queryCells.map((cell) => (
                <DataDocDAGExporterListItem
                    queryCell={cell}
                    key={cell.id}
                    queryEngineById={queryEngineById}
                />
            ))}
            {queryCells.length === 0 ? (
                <EmptyText className="mt12">No More Query Cells</EmptyText>
            ) : null}
        </div>
    );
};

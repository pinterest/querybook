import * as React from 'react';
import { useDispatch } from 'react-redux';
import { ContentState } from 'draft-js';
import { Link } from 'react-router-dom';

import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { getWithinEnvUrl } from 'lib/utils/query-string';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { Dispatch, IStoreState } from 'redux/store/types';
import { fetchDataTableIfNeeded } from 'redux/dataSources/action';
import { Icon } from 'ui/Icon/Icon';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { Title } from 'ui/Title/Title';

interface IProps {
    tableId: number;
}

export const BoardDataTableItem: React.FunctionComponent<IProps> = ({
    tableId,
}) => {
    const { table, schema } = useShallowSelector((state: IStoreState) => {
        const tableFromState = state.dataSources.dataTablesById[tableId];
        const schemaFromState = tableFromState
            ? state.dataSources.dataSchemasById[tableFromState.schema]
            : null;

        return {
            table: tableFromState,
            schema: schemaFromState,
        };
    });

    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(fetchDataTableIfNeeded(tableId));
    }, [tableId]);

    return (
        <div className="BoardDataTableItem BoardItem mv24 p12">
            <div className="BoardDataTableItem-top horizontal-space-between">
                <div className="flex-row">
                    <Link
                        to={{
                            pathname: getWithinEnvUrl(`/table/${table.id}/`),
                            state: {
                                isModal: true,
                            },
                        }}
                        className="BoardItem-title"
                    >
                        <Title size={4}>
                            {schema?.name}.{table.name}
                        </Title>
                    </Link>
                    <BoardItemAddButton
                        size={16}
                        itemType="table"
                        itemId={tableId}
                    />
                </div>
                <Icon name="database" className="BoardItemIcon mh8" />
            </div>
            <div className="BoardDataTableItem-desc">
                {(table.description as ContentState).getPlainText().length ? (
                    <RichTextEditor
                        value={table.description as ContentState}
                        readOnly={true}
                        className="mt8"
                    />
                ) : null}
            </div>
        </div>
    );
};

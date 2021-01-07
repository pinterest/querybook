import React, { useCallback } from 'react';
import { IDataTableWarning, DataTableWarningSeverity } from 'const/metastore';
import { useDispatch } from 'react-redux';

import { generateFormattedDate } from 'lib/utils/datetime';
import { Dispatch } from 'redux/store/types';
import { getEnumEntries } from 'lib/typescript';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Card } from 'ui/Card/Card';
import { GenericCRUD } from 'ui/GenericCRUD/GenericCRUD';
import {
    deleteTableWarnings,
    createTableWarnings,
    updateTableWarnings,
} from 'redux/dataSources/action';
import { Icon } from 'ui/Icon/Icon';
import { FormWrapper } from 'ui/Form/FormWrapper';

import './DataTableViewWarnings.scss';
import { UserName } from 'components/UserBadge/UserName';

interface IProps {
    tableId: number;
    tableWarnings: IDataTableWarning[];
}
export const DataTableViewWarnings: React.FC<IProps> = ({
    tableId,
    tableWarnings,
}) => {
    const [displayNewForm, setDisplayNewForm] = React.useState(false);
    const dispatch: Dispatch = useDispatch();
    const deleteWarning = useCallback(
        (item: IDataTableWarning) => dispatch(deleteTableWarnings(item.id)),
        []
    );
    const createWarning = useCallback(
        (item: IDataTableWarning) =>
            dispatch(createTableWarnings(tableId, item.message, item.severity)),
        []
    );
    const updateWarning = useCallback(
        (warningId: number) => async (fields: Partial<IDataTableWarning>) =>
            dispatch(updateTableWarnings(warningId, fields)),
        []
    );

    const renderWarningDOM = (item: Partial<IDataTableWarning>) => (
        <FormWrapper className="DataTableWarningForm" minLabelWidth="100px">
            <div className="horizontal-space-between">
                <div className="flex1">
                    <SimpleField
                        name="severity"
                        type="react-select"
                        options={getEnumEntries(DataTableWarningSeverity).map(
                            ([key, value]) => ({
                                value,
                                label: key,
                                color:
                                    DataTableWarningSeverity.WARNING === value
                                        ? 'var(--color-yellow)'
                                        : 'var(--color-red)',
                            })
                        )}
                    />
                </div>

                <div className="right-align flex1">
                    {item.updated_by != null ? (
                        <div>
                            Edited by <UserName uid={item.updated_by} /> on{' '}
                            {generateFormattedDate(item.updated_at)}
                        </div>
                    ) : null}
                </div>
            </div>

            <SimpleField
                name="message"
                type="textarea"
                placeholder="Be concise with the description"
                rows={1}
            />
        </FormWrapper>
    );

    const getCardsDOM = () =>
        tableWarnings.map((warning) => (
            <Card key={warning.id} title="" width="100%" flexRow>
                <GenericCRUD
                    item={warning}
                    deleteItem={deleteWarning}
                    updateItem={updateWarning(warning.id)}
                    renderItem={renderWarningDOM}
                />
            </Card>
        ));

    const getNewFormDOM = () => {
        if (displayNewForm) {
            return (
                <Card title="" width="100%" flexRow>
                    <GenericCRUD<Partial<IDataTableWarning>>
                        item={{
                            message: '',
                            severity: DataTableWarningSeverity.WARNING,
                        }}
                        createItem={createWarning}
                        deleteItem={() => setDisplayNewForm(false)}
                        renderItem={renderWarningDOM}
                    />
                </Card>
            );
        } else {
            return (
                <Card
                    title=""
                    width="100%"
                    flexRow
                    onClick={() => {
                        setDisplayNewForm(true);
                    }}
                >
                    <div className=" flex-row">
                        <Icon name="plus" className="mr8" />
                        <span>create a new warning</span>
                    </div>
                </Card>
            );
        }
    };

    return (
        <div className="DataTableViewWarnings">
            <div className="mb16">
                Warning message added here will show up in the query editor when
                the table is used by the user.
            </div>
            <div className="DataTableViewWarnings-new">{getNewFormDOM()}</div>
            <div className="DataTableViewWarnings-list flex-column">
                {getCardsDOM()}
            </div>
        </div>
    );
};

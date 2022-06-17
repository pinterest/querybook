import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { UserName } from 'components/UserBadge/UserName';
import { DataTableWarningSeverity, IDataTableWarning } from 'const/metastore';
import { getEnumEntries } from 'lib/typescript';
import { generateFormattedDate } from 'lib/utils/datetime';
import {
    createTableWarnings,
    deleteTableWarnings,
    updateTableWarnings,
} from 'redux/dataSources/action';
import { Dispatch } from 'redux/store/types';
import { TextButton } from 'ui/Button/Button';
import { Card } from 'ui/Card/Card';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { GenericCRUD } from 'ui/GenericCRUD/GenericCRUD';
import { AccentText } from 'ui/StyledText/StyledText';

import './DataTableViewWarnings.scss';

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
            dispatch(
                createTableWarnings(tableId, item.message, item.severity)
            ).then((newWarning) => {
                setDisplayNewForm(false);
                return newWarning;
            }),
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
                        <div className="edit-text mt8 mr8">
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
                    alignLeft
                    onClick={() => {
                        setDisplayNewForm(true);
                    }}
                >
                    <TextButton icon="Plus" title="New Warning" />
                </Card>
            );
        }
    };

    return (
        <div className="DataTableViewWarnings">
            <AccentText className="mb12" size="text" color="light" noUserSelect>
                Warning message will show up in the query editor when the table
                is used
            </AccentText>
            {tableWarnings.length ? (
                <div className="DataTableViewWarnings-list flex-column mt16">
                    {getCardsDOM()}
                </div>
            ) : null}
            <div className="DataTableViewWarnings-new mt16">
                {getNewFormDOM()}
            </div>
        </div>
    );
};

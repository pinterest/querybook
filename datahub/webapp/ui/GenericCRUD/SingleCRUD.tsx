import React from 'react';
import { Formik, FormikConfig } from 'formik';

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import './SingleCRUD.scss';
import { Button } from 'ui/Button/Button';

export interface ISingleCRUDProps<T> extends Partial<FormikConfig<T>> {
    item: T;

    createItem?: (item: T) => Promise<T>;
    updateItem?: (item: T) => Promise<T>;
    deleteItem?: (item: T) => any;
    onDelete?: () => void;

    // Refresh function when a new item is created, deleted, or updated
    onItemCUD?: (item?: T) => any;

    validationSchema?: any;
    renderItem: (item, handleItemChange) => React.ReactChild;
}

export function SingleCRUD<T>({
    item,
    createItem,
    updateItem,
    deleteItem,
    onItemCUD,
    onDelete,
    renderItem,

    ...formikProps
}: ISingleCRUDProps<T>) {
    const handleDeleteItem = React.useCallback(async () => {
        await deleteItem(item);
        if (onItemCUD) {
            await onItemCUD();
        }
        if (onDelete) {
            onDelete();
        }
    }, [deleteItem, onItemCUD, item]);

    const handleSaveItem = React.useCallback(
        async (values) => {
            if (createItem) {
                await createItem(values);
            } else {
                await updateItem(values);
            }

            if (onItemCUD) {
                await onItemCUD();
            }
        },
        [createItem, updateItem, onItemCUD]
    );

    return (
        <div className="SingleCRUD">
            <Formik
                initialValues={item}
                enableReinitialize
                onSubmit={handleSaveItem}
                {...formikProps}
            >
                {({
                    isValid,
                    values,
                    setFieldValue,
                    handleSubmit,
                    isSubmitting,
                }) => {
                    const deleteButton = deleteItem && (
                        <AsyncButton
                            title={createItem ? 'Cancel' : 'Delete'}
                            icon="trash"
                            onClick={handleDeleteItem}
                        />
                    );

                    const saveButton = (
                        <Button
                            disabled={
                                !isValid || item === values || isSubmitting
                            }
                            title={createItem ? 'Create' : 'Save'}
                            icon="save"
                            onClick={() => handleSubmit()}
                        />
                    );

                    return (
                        <div>
                            {renderItem(values, setFieldValue)}
                            <div>
                                <br />
                                <div className="right-align">
                                    <div>{deleteButton}</div>
                                    <div>{saveButton}</div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </Formik>
        </div>
    );
}

import { Formik, FormikConfig } from 'formik';
import { isEmpty } from 'lodash';
import React from 'react';
import toast from 'react-hot-toast';

import { getChangedObject } from 'lib/utils';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { FormError } from 'ui/Form/FormError';

import './GenericCRUD.scss';

export interface IGenericCRUDProps<T> extends Partial<FormikConfig<T>> {
    item: T;

    createItem?: (item: T) => Promise<T>;
    updateItem?: (updatedItemFields: Partial<T>) => Promise<T>;
    deleteItem?: (item: T) => any;
    onDelete?: () => void;

    // Refresh function when a new item is created, deleted, or updated
    onItemCUD?: (item?: T) => any;

    validationSchema?: any;

    renderActions?: (item: T) => React.ReactChild;
    renderItem: (
        item: T,
        handleItemChange: (
            field: string,
            value: any,
            shouldValidate?: boolean
        ) => void
    ) => React.ReactChild;
}

export function GenericCRUD<T extends Record<any, any>>({
    item,
    createItem,
    updateItem,
    deleteItem,
    onItemCUD,
    onDelete,
    renderItem,
    renderActions,
    ...formikProps
}: IGenericCRUDProps<T>) {
    const handleDeleteItem = React.useCallback(async () => {
        await deleteItem(item);
        toast.success('Deleted!');
        if (onItemCUD) {
            await onItemCUD();
        }
        if (onDelete) {
            onDelete();
        }
    }, [deleteItem, onItemCUD, item]);

    const handleSaveItem = React.useCallback(
        async (values: T) => {
            if (createItem) {
                await createItem(values);
                toast.success('Created!');
            } else {
                await updateItem(getChangedObject(item, values));
                toast.success('Updated!');
            }

            if (onItemCUD) {
                await onItemCUD();
            }
        },
        [createItem, updateItem, onItemCUD]
    );

    return (
        <div className="GenericCRUD">
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
                    errors,
                }) => {
                    const deleteButton = deleteItem && (
                        <AsyncButton
                            title={createItem ? 'Cancel' : 'Delete'}
                            icon="Trash"
                            onClick={handleDeleteItem}
                            color="cancel"
                        />
                    );

                    const saveButton = (
                        <Button
                            disabled={
                                !isValid || item === values || isSubmitting
                            }
                            title={createItem ? 'Create' : 'Save'}
                            icon="Save"
                            onClick={() => handleSubmit()}
                        />
                    );

                    const errorSection = !isEmpty(errors) ? (
                        <FormError errors={errors} />
                    ) : null;

                    return (
                        <div>
                            {renderItem(values, setFieldValue)}
                            {errorSection}
                            <div className="pv8 right-align mr8">
                                {renderActions?.(values)}
                                {deleteButton}
                                {saveButton}
                            </div>
                        </div>
                    );
                }}
            </Formik>
        </div>
    );
}

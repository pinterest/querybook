import React from 'react';
import { Formik, FormikConfig } from 'formik';
import { isEmpty } from 'lodash';

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { getChangedObject } from 'lib/utils';
import toast from 'react-hot-toast';
import './GenericCRUD.scss';
import { FormError } from 'ui/Form/FormError';

export interface IGenericCRUDProps<T> extends Partial<FormikConfig<T>> {
    item: T;

    createItem?: (item: T) => Promise<T>;
    updateItem?: (updatedItemFields: Partial<T>) => Promise<T>;
    deleteItem?: (item: T) => any;
    onDelete?: () => void;

    // Refresh function when a new item is created, deleted, or updated
    onItemCUD?: (item?: T) => any;

    validationSchema?: any;
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
                            icon="trash"
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
                            icon="save"
                            color="accent"
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
                            <div className="pv8 right-align">
                                <div>{deleteButton}</div>
                                <div>{saveButton}</div>
                            </div>
                        </div>
                    );
                }}
            </Formik>
        </div>
    );
}

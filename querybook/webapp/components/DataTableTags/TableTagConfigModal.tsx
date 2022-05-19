import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import React, { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import { ITag, ITagMeta } from 'const/tag';
import { Dispatch, IStoreState } from 'redux/store/types';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Modal } from 'ui/Modal/Modal';
import { ColorPalette } from 'const/chartColors';
import AllLucideIcons from 'ui/Icon/LucideIcons';
import { Icon } from 'ui/Icon/Icon';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { updateTag } from 'redux/tag/action';

export const TableTagConfigModal: React.FC<{
    tag: ITag;
    onHide: () => void;
}> = ({ tag, onHide }) => {
    const isAdmin = useSelector(
        (state: IStoreState) => state.user.myUserInfo.isAdmin
    );

    const colorOptions = useMemo(
        () =>
            ColorPalette.map((color) => ({
                value: color.name,
                label: color.name,
                color: color.color,
            })),
        []
    );

    const iconOptions = useMemo(
        () =>
            Object.keys(AllLucideIcons).map((iconName) => ({
                value: iconName,
                label: (
                    <span className="flex-row">
                        <Icon
                            name={iconName as any}
                            size={16}
                            className="mr8"
                        />
                        {iconName}
                    </span>
                ),
            })),
        []
    );

    const initialValues: ITagMeta = useMemo(
        () => ({
            rank: 0,
            tooltip: undefined,
            admin: false,
            color: undefined,
            icon: undefined,
            ...tag.meta,
        }),
        [tag]
    );

    const dispatch = useDispatch<Dispatch>();
    const handleSubmit = useCallback(
        async (values: ITagMeta) => {
            toast.promise(
                dispatch(
                    updateTag({
                        ...tag,
                        meta: values,
                    })
                ),
                {
                    success: 'Tag updated!',
                    loading: 'Updating tag',
                    error: 'Failed to updated tag',
                }
            );
            onHide();
        },
        [dispatch, onHide, tag]
    );

    const form = (
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
            {({ submitForm }) => (
                <div className="ph12">
                    <FormWrapper minLabelWidth="120px">
                        <SimpleField name="tooltip" type="input" />
                        <SimpleField
                            name="color"
                            type="react-select"
                            options={colorOptions}
                        />
                        <SimpleField
                            name="icon"
                            type="react-select"
                            options={iconOptions}
                        />
                        {isAdmin && (
                            <SimpleField
                                name="admin"
                                type="toggle"
                                help="Toggling this on would make tag only editable by an admin"
                            />
                        )}
                        <SimpleField
                            name="rank"
                            help="Higher ranked tags will appear first"
                            type="number"
                        />
                    </FormWrapper>
                    <div className="right-align mt12">
                        <AsyncButton
                            onClick={submitForm}
                            title="Save"
                            color="confirm"
                        />
                    </div>
                </div>
            )}
        </Formik>
    );

    return (
        <Modal onHide={onHide} title={`Editing Tag ${tag.name}`}>
            {form}
        </Modal>
    );
};

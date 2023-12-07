import { useField } from 'formik';
import React from 'react';

import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';

import './RichTextField.scss';

export interface IRichTextFieldProps {
    name: string;
    autoFocus?: boolean;
    onSubmit?: () => void;
}

export const RichTextField: React.FC<IRichTextFieldProps> = ({
    name,
    autoFocus,
    onSubmit,
}) => {
    const [field, meta, helpers] = useField(name);

    const { value } = meta;
    const { setValue } = helpers;

    const handleChange = React.useCallback(
        (newValue) => setValue(newValue.getCurrentContent()),
        []
    );

    return (
        <RichTextEditor
            value={value}
            onChange={handleChange}
            autoFocus={autoFocus}
            onSubmit={onSubmit}
        />
    );
};

import React from 'react';
import { useField } from 'formik';

import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { ContentState, convertFromHTML } from 'draft-js';

export interface IRichTextFieldProps {
    name: string;
}

export const RichTextField: React.FC<IRichTextFieldProps> = ({ name }) => {
    const [field, meta, helpers] = useField(name);

    const { value } = meta;
    const { setValue } = helpers;

    return (
        <RichTextEditor
            value={value}
            onChange={(newValue) => setValue(newValue.getCurrentContent())}
        />
    );
};

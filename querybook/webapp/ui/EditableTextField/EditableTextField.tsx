import clsx from 'clsx';
import * as DraftJs from 'draft-js';
import React from 'react';

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';

import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import './EditableTextField.scss';

export interface IEditableTextFieldProps {
    value: DraftJs.ContentState;
    onSave: (content: DraftJs.ContentState) => Promise<any>;
    className?: string;
}

export const EditableTextField: React.FunctionComponent<IEditableTextFieldProps> = ({
    value,
    onSave,
    className,
}) => {
    const [editMode, setEditMode] = React.useState(false);
    const editorRef = React.useRef<RichTextEditor>(null);

    const toggleEditMode = () => setEditMode(!editMode);
    const setEditorContent = (content: DraftJs.ContentState) => {
        if (editorRef.current) {
            editorRef.current.setContent(content);
        }
    };
    const handleCancel = () => {
        setEditorContent(value);
        toggleEditMode();
    };
    const handleSave = async () => {
        if (onSave && editorRef.current) {
            await onSave(editorRef.current.getContent());
        }
        toggleEditMode();
    };

    React.useEffect(() => {
        setEditorContent(value);
    }, [value]);

    const toggleEditModeButton = !editMode ? (
        <span onClick={toggleEditMode} className="edit-mode-button">
            <i className="fa fa-edit" />
        </span>
    ) : null;

    const editor = (
        <div className="editor-wrapper">
            <RichTextEditor
                value={value}
                readOnly={!editMode}
                ref={editorRef}
            />
            {toggleEditModeButton}
        </div>
    );

    const editModeButtons = editMode ? (
        <div className="edit-mode-footer">
            <Button color="cancel" title="Cancel" onClick={handleCancel} />
            <AsyncButton color="confirm" title="Save" onClick={handleSave} />
        </div>
    ) : null;

    return (
        <div
            className={clsx({
                EditableTextField: true,
                'edit-mode': editMode,
                [className]: Boolean(className),
            })}
        >
            {editor}
            {editModeButtons}
        </div>
    );
};

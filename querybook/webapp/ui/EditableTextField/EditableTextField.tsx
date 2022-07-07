import clsx from 'clsx';
import * as DraftJs from 'draft-js';
import React, { useCallback } from 'react';

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button, TextButton } from 'ui/Button/Button';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';

import './EditableTextField.scss';

export interface IEditableTextFieldProps {
    value: DraftJs.ContentState;
    onSave: (content: DraftJs.ContentState) => Promise<any>;
    className?: string;
    readonly?: boolean;
}

export const EditableTextField: React.FunctionComponent<
    IEditableTextFieldProps
> = ({ value, onSave, className, readonly = false }) => {
    const [editMode, setEditMode] = React.useState(false);
    const editorRef = React.useRef<RichTextEditor>(null);

    const toggleEditMode = useCallback(
        () =>
            setEditMode((oldMode) => {
                if (!oldMode) {
                    // Wait for some time for the editor to be editable to focus
                    // TODO: once RichTextEditor is in hooks, use autoFocus prop to
                    // control the behavior instead
                    setTimeout(() => {
                        editorRef.current?.focus();
                    }, 500);
                }
                return !oldMode;
            }),
        []
    );
    const setEditorContent = useCallback((content: DraftJs.ContentState) => {
        if (editorRef.current) {
            editorRef.current.setContent(content);
        }
    }, []);
    const handleCancel = useCallback(() => {
        setEditorContent(value);
        toggleEditMode();
    }, [setEditorContent, toggleEditMode, value]);

    const handleSave = useCallback(async () => {
        if (onSave && editorRef.current) {
            await onSave(editorRef.current.getContent());
        }
        toggleEditMode();
    }, [toggleEditMode, onSave]);

    React.useEffect(() => {
        setEditorContent(value);
    }, [value]);

    const toggleEditModeButton =
        !editMode && !readonly ? (
            <TextButton
                icon="Edit"
                title="Edit"
                onClick={toggleEditMode}
                className="edit-mode-button"
            />
        ) : null;

    const editor = (
        <div className="editor-wrapper">
            <RichTextEditor
                value={value}
                readOnly={readonly || !editMode}
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

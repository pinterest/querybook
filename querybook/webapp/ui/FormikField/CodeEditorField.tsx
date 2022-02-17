import React, { useCallback, useMemo } from 'react';
import { useField } from 'formik';
import { Controlled as ReactCodeMirror } from 'react-codemirror2';
import type { Editor, EditorConfiguration } from 'codemirror';
import { useSelector } from 'react-redux';
import { IStoreState } from 'redux/store/types';
import { getCodeEditorTheme } from 'lib/utils';
import { KeyMap } from 'lib/utils/keyboard';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';
import { StyledQueryEditor } from 'components/QueryEditor/StyledQueryEditor';

export interface ICodeEditorFieldProps {
    name: string;
    mode?: string;
}

const CodeEditorField: React.FC<ICodeEditorFieldProps> = ({
    name,
    mode,
    ...CodeEditorProps
}) => {
    const [, meta, helpers] = useField(name);

    const { value } = meta;
    const { setValue, setTouched } = helpers;

    const editorTheme = useSelector((state: IStoreState) =>
        getCodeEditorTheme(state.user.computedSettings.theme)
    );

    const handleEditorMount = useCallback((editor: Editor) => {
        setTimeout(() => {
            editor.refresh();
        }, 50);
    }, []);

    const options: EditorConfiguration = useMemo(
        () => ({
            mode: mode ?? '', // Temporarily hardcoded
            indentWithTabs: true,
            lineNumbers: true,
            gutters: ['CodeMirror-lint-markers'],
            extraKeys: {
                [KeyMap.queryEditor.autocomplete.key]: 'autocomplete',
                [KeyMap.queryEditor.indentLess.key]: 'indentLess',
                [KeyMap.queryEditor.toggleComment.key]: 'toggleComment',
            },
            indentUnit: 4,
            theme: editorTheme,
            matchBrackets: true,
            autoCloseBrackets: true,
            highlightSelectionMatches: true,
        }),
        [mode, editorTheme]
    );

    return (
        <StyledQueryEditor height="auto">
            <ReactCodeMirror
                editorDidMount={handleEditorMount}
                options={options}
                value={value}
                onBeforeChange={(_, __, newValue) => {
                    setTouched(true);
                    setValue(newValue);
                }}
                {...CodeEditorProps}
            />
        </StyledQueryEditor>
    );
};

export default CodeEditorField;

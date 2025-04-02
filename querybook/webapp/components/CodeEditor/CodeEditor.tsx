import { acceptCompletion, startCompletion } from '@codemirror/autocomplete';
import { indentService } from '@codemirror/language';
import CodeMirror, {
    BasicSetupOptions,
    EditorView,
    Extension,
    KeyBinding,
    ReactCodeMirrorRef,
    ViewUpdate,
} from '@uiw/react-codemirror';
import React, {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useMemo,
} from 'react';

import { useUserCodeEditorConfig } from 'hooks/redux/useUserCodeEditorConfig';
import { CodeMirrorKeyMap } from 'lib/codemirror';
import { KeyMap } from 'lib/utils/keyboard';

import { CustomMonokaiDarkTheme, CustomXcodeTheme } from './themes';
import { useEventsExtension } from './useEventsExtension';
import { useKeyMapExtension } from './useKeyMapExtension';
import { useOptionsExtension } from './useOptionsExtension';
import { useSearchExtension } from './useSearchExtension';

import './CodeEditor.scss';

interface ICodeEditorProps {
    value: string;
    cellId?: number;
    keyMap?: CodeMirrorKeyMap; // maintain backward compatibility for v5 keymaps
    keyBindings?: KeyBinding[];
    extensions?: Extension[];
    lineWrapping?: boolean;
    height?: 'auto' | 'full' | 'fixed';
    readonly?: boolean;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onSelection?: (hasSelection: boolean) => void;
}

export const CodeEditor = forwardRef<ReactCodeMirrorRef, ICodeEditorProps>(
    (
        {
            value,
            cellId,
            keyMap = {},
            keyBindings = [],
            extensions = [],
            lineWrapping = false,
            height = 'auto',
            readonly = false,
            onChange,
            onFocus,
            onBlur,
            onSelection,
        }: ICodeEditorProps,
        ref
    ) => {
        const editorRef = React.useRef<ReactCodeMirrorRef>();
        useImperativeHandle(ref, () => editorRef.current, [editorRef.current]);

        const { codeEditorTheme, options, fontSize } =
            useUserCodeEditorConfig();

        const basicSetup = useMemo<BasicSetupOptions>(
            () => ({
                drawSelection: true,
                highlightSelectionMatches: true,
                searchKeymap: false,
                foldGutter: true,
                allowMultipleSelections: true,
            }),
            []
        );

        const eventsExtension = useEventsExtension({
            onFocus,
            onBlur,
        });

        const finalKeyBindings = useMemo(
            () => [
                { key: 'Tab', run: acceptCompletion },
                {
                    key: KeyMap.codeEditor.autocomplete.key,
                    run: startCompletion,
                },
                ...keyBindings,
            ],
            [keyBindings]
        );
        const keyMapExtention = useKeyMapExtension({
            keyMap,
            keyBindings: finalKeyBindings,
        });

        const optionsExtension = useOptionsExtension({
            lineWrapping,
            options,
        });

        const selectionExtension = useMemo(
            () =>
                EditorView.updateListener.of((update) => {
                    if (update.selectionSet) {
                        const selection = update.state.selection.main;
                        onSelection?.(!selection.empty);
                    }
                }),
            [onSelection]
        );

        const searchExtension = useSearchExtension({
            editorView: editorRef.current?.view,
            cellId,
        });

        const onChangeHandler = useCallback(
            (value: string, viewUpdate: ViewUpdate) => {
                onChange?.(value);
            },
            [onChange]
        );
        const finalExtensions = useMemo(
            () => [
                keyMapExtention,
                eventsExtension,
                optionsExtension,
                searchExtension,
                selectionExtension,
                indentService.of((context, pos) => {
                    if (pos === 0) {
                        return 0;
                    }
                    return context.lineIndent(pos - 1);
                }),
                ...extensions,
            ],
            [
                keyMapExtention,
                eventsExtension,
                optionsExtension,
                searchExtension,
                selectionExtension,
                extensions,
            ]
        );
        return (
            <div
                className="CodeEditor"
                style={{
                    fontSize: fontSize ?? undefined,
                }}
            >
                <CodeMirror
                    ref={editorRef}
                    theme={
                        codeEditorTheme === 'dark'
                            ? CustomMonokaiDarkTheme
                            : CustomXcodeTheme
                    }
                    className="ReactCodeMirror"
                    value={value}
                    height="100%"
                    maxHeight={height === 'auto' ? '50vh' : null}
                    extensions={finalExtensions}
                    basicSetup={basicSetup}
                    // editable is working on the editor view. set as true to make it still respond to keymaps, e.g. search
                    editable={true}
                    // readonly is working on the editor state. when true, the editor content will not change anyway.
                    readOnly={readonly}
                    autoFocus={false}
                    onChange={onChangeHandler}
                    indentWithTab={false}
                />
            </div>
        );
    }
);

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IStoreState } from 'redux/store/types';

import { UserSettingsFontSizeToCSSFontSize } from 'const/font';
import { ISearchAndReplaceContextType } from 'context/searchAndReplace';
import CodeMirror, { CodeMirrorKeyMap } from 'lib/codemirror';
import { AutoCompleteType } from 'lib/sql-helper/sql-autocompleter';
import { getCodeEditorTheme } from 'lib/utils';

export function useUserQueryEditorConfig(
    searchContext: ISearchAndReplaceContextType
): {
    codeEditorTheme: string;
    fontSize: string;
    keyMap: CodeMirrorKeyMap;
    options: CodeMirror.EditorConfiguration;
    autoCompleteType: AutoCompleteType;
} {
    const editorSettings = useSelector((state: IStoreState) => ({
        theme: getCodeEditorTheme(state.user.computedSettings['theme']),
        fontSize:
            UserSettingsFontSizeToCSSFontSize[
                state.user.computedSettings['editor_font_size']
            ],
        autoComplete: state.user.computedSettings['auto_complete'],
        tab: state.user.computedSettings['tab'],
    }));
    const indentWithTabs = editorSettings.tab === 'tab';
    const tabSize =
        !indentWithTabs && editorSettings.tab === 'tab space 2' ? 2 : 4;

    const keyMap = useMemo(
        () => ({
            Tab: (cm: CodeMirror.Editor & CodeMirror.Doc) => {
                if (indentWithTabs) {
                    return CodeMirror.Pass;
                }
                if (cm.getMode().name === 'null') {
                    cm.execCommand('insertTab');
                } else {
                    if (cm.somethingSelected()) {
                        cm.execCommand('indentMore');
                    } else {
                        cm.execCommand('insertSoftTab');
                    }
                }
            },
            Backspace: (cm: CodeMirror.Editor & CodeMirror.Doc) => {
                if (!cm.somethingSelected()) {
                    const cursorsPos = cm
                        .listSelections()
                        .map((selection) => selection.anchor);
                    const indentUnit = cm.getOption('indentUnit');
                    let shouldDelChar = false;
                    for (const cursorPos of cursorsPos) {
                        const indentation = cm.getStateAfter(cursorPos.line)
                            .indented;
                        if (
                            !(
                                indentation !== 0 &&
                                cursorPos.ch <= indentation &&
                                cursorPos.ch % indentUnit === 0
                            )
                        ) {
                            shouldDelChar = true;
                        }
                    }
                    if (!shouldDelChar) {
                        cm.execCommand('indentLess');
                    } else {
                        cm.execCommand('delCharBefore');
                    }
                } else {
                    cm.execCommand('delCharBefore');
                }
            },
            'Shift-Tab': (cm: CodeMirror.Editor & CodeMirror.Doc) =>
                cm.execCommand('indentLess'),

            ...(searchContext
                ? {
                      'Cmd-F': searchContext.showSearchAndReplace,
                      Esc: searchContext.hideSearchAndReplace,
                  }
                : {}),
        }),
        [indentWithTabs, tabSize]
    );

    const options = useMemo(
        () => ({
            tabSize,
            indentWithTabs,
            indentUnit: tabSize,
        }),
        [tabSize, indentWithTabs]
    );

    return {
        codeEditorTheme: editorSettings.theme,
        fontSize: editorSettings.fontSize,
        autoCompleteType: editorSettings.autoComplete as AutoCompleteType,
        // From: https://github.com/codemirror/CodeMirror/issues/988
        keyMap,
        options,
    };
}

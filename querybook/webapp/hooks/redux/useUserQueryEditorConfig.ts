import { useMemo } from 'react';

import { UserSettingsFontSizeToCSSFontSize } from 'const/font';
import CodeMirror from 'lib/codemirror';
import { AutoCompleteType } from 'lib/sql-helper/sql-autocompleter';
import { IStoreState } from 'redux/store/types';

import { useShallowSelector } from './useShallowSelector';

export function useUserQueryEditorConfig(): {
    codeEditorTheme: string;
    fontSize: string;
    options: CodeMirror.EditorConfiguration;
    autoCompleteType: AutoCompleteType;
} {
    const editorSettings = useShallowSelector((state: IStoreState) => ({
        theme: state.user.computedSettings['theme'],
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
        options,
    };
}

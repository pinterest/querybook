import { useMemo } from 'react';

import { UserSettingsFontSizeToCSSFontSize } from 'const/font';
import { AutoCompleteType } from 'hooks/queryEditor/extensions/useAutoCompleteExtension';
import CodeMirror from 'lib/codemirror';
import { IStoreState } from 'redux/store/types';

import { useShallowSelector } from './useShallowSelector';

export function useUserQueryEditorConfig(): {
    codeEditorTheme: string;
    fontSize: string;
    options: CodeMirror.EditorConfiguration;
    autoCompleteType: AutoCompleteType;
    sqlCompleteEnabled: boolean;
} {
    const editorSettings = useShallowSelector((state: IStoreState) => ({
        theme: state.user.computedSettings['theme'],
        fontSize:
            UserSettingsFontSizeToCSSFontSize[
                state.user.computedSettings['editor_font_size']
            ],
        autoComplete: state.user.computedSettings['auto_complete'],
        tab: state.user.computedSettings['tab'],
        sqlCompleteEnabled:
            state.user.computedSettings['sql_complete'] === 'enabled',
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
        sqlCompleteEnabled: editorSettings.sqlCompleteEnabled,
        options,
    };
}

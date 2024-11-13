import { EditorView, Panel, showPanel } from '@uiw/react-codemirror';
import React, { useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';

import { StatusBar } from 'components/QueryEditor/StatusBar';

export const useStatusBarExtension = ({ isLinting, lintSummary }) => {
    const createStatusBar = useCallback(
        (view: EditorView): Panel => {
            const dom = document.createElement('div');
            ReactDOM.render(
                <StatusBar isLinting={isLinting} lintSummary={lintSummary} />,
                dom
            );
            return {
                dom,
            };
        },
        [isLinting, lintSummary]
    );

    const extension = useMemo(
        () => showPanel.of(createStatusBar),
        [createStatusBar]
    );

    return extension;
};

import * as CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';

// TODO: Check if changing this to:
// @import (inline) "./node_modules/codemirror/lib/codemirror.css";
// From codemirror non-react package:
import 'codemirror/mode/python/python';
import 'codemirror/mode/sql/sql';

// Lint addon
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/lint.css';

// Autocomplete Addon
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/sql-hint';

import 'codemirror/theme/monokai.css';
import 'codemirror/theme/duotone-light.css';
import 'codemirror/theme/solarized.css';
import 'codemirror/theme/material-palenight.css';

// Highlight Addon
import 'codemirror/addon/comment/comment';
// Match brakcets addon
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';

// This should apply the hover option to codemirror
import 'lib/codemirror/codemirror-hover';
import 'codemirror/addon/runmode/runmode';

// Search highlighting
import 'codemirror/addon/search/match-highlighter.js';

// Local styling
import './editor_styles.scss';

declare module 'codemirror' {
    // This is copied from runmode.d.ts. Not sure how to import it :(
    function runMode(
        text: string,
        modespec: any,
        callback: HTMLElement | ((text: string, style: string | null) => void),
        options?: { tabSize?: number; state?: any }
    ): void;
}

export default CodeMirror;

export type CodeMirrorKeyMap = Record<
    string,
    (editor: CodeMirror.Editor) => any | string
>;

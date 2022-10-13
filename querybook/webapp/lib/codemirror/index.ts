// Custom editor command
import { attachCustomCommand } from './custom-commands';
import * as CodeMirror from 'codemirror';

// Highlight Addon
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/edit/closebrackets';
// Match brakcets addon
import 'codemirror/addon/edit/matchbrackets';
// Autocomplete Addon
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/sql-hint';
// Lint addon
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/addon/runmode/runmode';
// Search highlighting
import 'codemirror/addon/search/match-highlighter.js';
import 'codemirror/lib/codemirror.css';
// From codemirror non-react package:
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/jinja2/jinja2';
import 'codemirror/theme/duotone-light.css';
import 'codemirror/theme/material-palenight.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/solarized.css';
// This should apply the hover option to codemirror
import 'lib/codemirror/codemirror-hover';

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

    function normalizeKeyMap(
        keyMap: Record<string, string | (() => any)>
    ): Record<string, string | (() => any)>;
}

attachCustomCommand(CodeMirror.commands);

export default CodeMirror;

export type CodeMirrorKeyMap = Record<
    string,
    (editor: CodeMirror.Editor) => any | string
>;

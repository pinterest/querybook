import { merge } from 'lodash';

import { isOSX } from 'lib/utils/os-platform';

const DEFAULT_KEY_MAP = {
    overallUI: {
        openSearch: {
            key: 'Cmd-K',
            name: 'Open Search',
        },
        toggleSidebar: {
            key: 'Cmd-b',
            name: 'Toggle Sidebar',
        },
        closeModal: {
            key: 'Esc',
            name: 'Close Modal',
        },
        confirmModal: {
            key: 'Enter',
            name: 'Confirm Modal',
        },
        submitComment: {
            key: 'Cmd-Enter',
            name: 'Submit Comment',
        },
    },
    dataDoc: {
        saveDataDoc: {
            key: 'Cmd-S',
            name: 'Save DataDoc',
        },
        openSearch: {
            key: 'Cmd-F',
            name: 'Open search and replace',
        },
        closeSearch: {
            key: 'Esc',
            name: 'Close search and replace',
        },
        previousCell: {
            key: 'Up',
            name: 'Go to previous cell',
        },
        nextCell: {
            key: 'Down',
            name: 'Go to next cell',
        },
        copyCell: {
            key: 'Alt-C',
            name: 'Copy current cell',
        },
        pasteCell: {
            key: 'Alt-V',
            name: 'Paste below current cell',
        },
        deleteCell: {
            key: 'Alt-D',
            name: 'Delete current cell',
        },
        toggleToC: {
            key: 'Alt-T',
            name: 'Toggle Table of Contents',
        },
    },
    richText: {
        addLink: {
            key: 'Cmd-L',
            name: 'Add Link',
        },
        bold: {
            key: 'Cmd-B',
            name: 'Bold',
        },
        italics: {
            key: 'Cmd-I',
            name: 'Italics',
        },
        strikethrough: {
            key: 'Cmd-Shift-X',
            name: 'Strikethrough',
        },
        deleteCell: {
            key: 'Ctrl-D',
            name: 'Delete current cell',
        },
    },
    aiCommandBar: {
        openCommands: {
            key: 'Cmd-/',
            name: 'Open commands',
        },
    },
    queryEditor: {
        runQuery: {
            key: 'Shift-Enter',
            name: 'Run query',
        },
        autocomplete: {
            key: 'Ctrl-Space',
            name: 'Force autocomplete',
        },
        indentLess: {
            key: 'Shift-Tab',
            name: 'Indent Less',
        },
        toggleComment: {
            key: 'Cmd-/',
            name: 'Toggle comment',
        },
        swapLineUp: {
            key: 'Alt-Up',
            name: 'Swap current line with the previous line',
        },
        swapLineDown: {
            key: 'Alt-Down',
            name: 'Swap current line with the next line',
        },

        openTable: {
            key: 'Cmd-P',
            name: 'Open table modal if on a table',
        },
        formatQuery: {
            key: 'Shift-Alt-F',
            name: 'Format query',
        },
        deleteCell: {
            key: 'Shift-Alt-D',
            name: 'Delete current cell',
        },
        changeEngine: {
            // Note this is combined with -1 -2 ... -9
            key: 'Alt',
            name: 'Alt-1, Alt-2, ..., Alt-9 to change the engine to the nth on the engine list.',
        },
        addCursorToPrevLine: {
            key: 'Cmd-Alt-Up',
            name: 'Select the same position on the above line and then edit all selected lines together',
        },
        addCursorToNextLine: {
            key: 'Cmd-Alt-Down',
            name: 'Select the same position on the below line and then edit all selected lines together',
        },
        focusCommandInput: {
            key: 'Cmd-I',
            name: 'Focus command input',
        },
    },
};

/**
 * The default keymap is only MacOSX specific, however CMD auto maps
 * to CTRL unless it is CodeMirror
 *
 * So for Windows (and linux?) we will convert the keymap for queryEditors
 * to ensure it is compatible for other platforms as well
 */
if (!isOSX) {
    const queryEditorConfig = DEFAULT_KEY_MAP.queryEditor;
    for (const [_, keyConfig] of Object.entries(queryEditorConfig)) {
        const keyConfigParts = keyConfig.key.split('-');
        if (keyConfigParts.includes('Cmd')) {
            // Swap Cmd with Ctrl
            keyConfig.key = keyConfigParts
                .map((part) => (part === 'Cmd' ? 'Ctrl' : part))
                .join('-');
        }
    }
}

export default merge(DEFAULT_KEY_MAP, window.CUSTOM_KEY_MAP);

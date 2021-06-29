import { merge } from 'lodash';

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
    },
};

export default merge(DEFAULT_KEY_MAP, window.CUSTOM_KEY_MAP);

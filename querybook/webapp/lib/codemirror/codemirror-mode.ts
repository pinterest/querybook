import CodeMirror from 'lib/codemirror/index';
import 'codemirror/addon/mode/multiplex';

export const SQL_JINJA_MODE = 'text/x-sql-jinja2';

CodeMirror.defineMode(SQL_JINJA_MODE, (config) => {
    const jinja2Mode = CodeMirror.getMode(config, 'text/jinja2');
    return CodeMirror.multiplexingMode(
        CodeMirror.getMode(config, 'text/x-hive'),
        {
            open: '{{',
            close: '}}',
            mode: jinja2Mode,
            parseDelimiters: true,
        },
        {
            open: '{%',
            close: '%}',
            mode: jinja2Mode,
            parseDelimiters: true,
        }
    );
});

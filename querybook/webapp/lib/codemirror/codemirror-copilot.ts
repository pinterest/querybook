import CodeMirror from 'codemirror';

CodeMirror.defineExtension('querySuggestions', function () {
    this.on('keyup', async (editor, event) => {
        if (event.code === 'Space') {
            console.log('CodeMirror Query Suggestions Extension');
        }
    });
});

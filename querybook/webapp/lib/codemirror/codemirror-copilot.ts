import CodeMirror from 'codemirror';

CodeMirror.defineExtension('queryAISuggestions', function () {
    this.on('keyup', async (editor, event) => {
        if (event.code === 'Space') {
            console.log('CodeMirror Query Suggestions Extension');
        }
    });
});

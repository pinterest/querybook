import { CommandActions, Pass, Pos } from 'codemirror';

export function attachCustomCommand(commands: CommandActions) {
    // Copied from https://github.com/codemirror/CodeMirror/blob/bd1b7d2976d768ae4e3b8cf209ec59ad73c0305a/keymap/sublime.js#L244
    (commands as any).swapLineUp = (cm) => {
        if (cm.isReadOnly()) {
            return Pass;
        }
        const ranges = cm.listSelections();
        const linesToMove = [];
        let at = cm.firstLine() - 1;
        const newSels = [];
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const from = range.from().line - 1;
            let to = range.to().line;
            newSels.push({
                anchor: Pos(range.anchor.line - 1, range.anchor.ch),
                head: Pos(range.head.line - 1, range.head.ch),
            });
            if (range.to().ch === 0 && !range.empty()) {
                --to;
            }
            if (from > at) {
                linesToMove.push(from, to);
            } else if (linesToMove.length) {
                linesToMove[linesToMove.length - 1] = to;
            }
            at = to;
        }
        cm.operation(() => {
            for (let i = 0; i < linesToMove.length; i += 2) {
                const from = linesToMove[i];
                const to = linesToMove[i + 1];
                const line = cm.getLine(from);
                cm.replaceRange(
                    '',
                    Pos(from, 0),
                    Pos(from + 1, 0),
                    '+swapLine'
                );
                if (to > cm.lastLine()) {
                    cm.replaceRange(
                        '\n' + line,
                        Pos(cm.lastLine()),
                        null,
                        '+swapLine'
                    );
                } else {
                    cm.replaceRange(line + '\n', Pos(to, 0), null, '+swapLine');
                }
            }
            cm.setSelections(newSels);
            cm.scrollIntoView();
        });
    };

    // Copied from https://github.com/codemirror/CodeMirror/blob/bd1b7d2976d768ae4e3b8cf209ec59ad73c0305a/keymap/sublime.js#L271
    (commands as any).swapLineDown = (cm) => {
        if (cm.isReadOnly()) {
            return Pass;
        }
        const ranges = cm.listSelections();
        const linesToMove = [];
        let at = cm.lastLine() + 1;
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = ranges.length - 1; i >= 0; i--) {
            const range = ranges[i];
            let from = range.to().line + 1;
            const to = range.from().line;
            if (range.to().ch === 0 && !range.empty()) {
                from--;
            }
            if (from < at) {
                linesToMove.push(from, to);
            } else if (linesToMove.length) {
                linesToMove[linesToMove.length - 1] = to;
            }
            at = to;
        }
        cm.operation(() => {
            for (let i = linesToMove.length - 2; i >= 0; i -= 2) {
                const from = linesToMove[i];
                const to = linesToMove[i + 1];
                const line = cm.getLine(from);
                if (from === cm.lastLine()) {
                    cm.replaceRange('', Pos(from - 1), Pos(from), '+swapLine');
                } else {
                    cm.replaceRange(
                        '',
                        Pos(from, 0),
                        Pos(from + 1, 0),
                        '+swapLine'
                    );
                }
                cm.replaceRange(line + '\n', Pos(to, 0), null, '+swapLine');
            }
            cm.scrollIntoView();
        });
    };

    // https://github.com/codemirror/codemirror5/blob/bd1b7d2976d768ae4e3b8cf209ec59ad73c0305a/keymap/sublime.js#L169
    const addCursorToSelection = (cm, dir) => {
        const ranges = cm.listSelections();
        const newRanges = [];
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const newAnchor = cm.findPosV(
                range.anchor,
                dir,
                'line',
                range.anchor.goalColumn
            );
            const newHead = cm.findPosV(
                range.head,
                dir,
                'line',
                range.head.goalColumn
            );
            newAnchor.goalColumn =
                range.anchor.goalColumn != null
                    ? range.anchor.goalColumn
                    : cm.cursorCoords(range.anchor, 'div').left;
            newHead.goalColumn =
                range.head.goalColumn != null
                    ? range.head.goalColumn
                    : cm.cursorCoords(range.head, 'div').left;
            const newRange = { anchor: newAnchor, head: newHead };
            newRanges.push(range);
            newRanges.push(newRange);
        }
        cm.setSelections(newRanges);
    };
    (commands as any).addCursorToPrevLine = (cm) => {
        addCursorToSelection(cm, -1);
    };
    (commands as any).addCursorToNextLine = (cm) => {
        addCursorToSelection(cm, 1);
    };
}

// from https://github.com/prismagraphql/chromeless-playground/blob/master/frontend/src/codemirror/codeEditor/addons/textHover.ts
import { bind } from 'lodash-decorators';
import * as CodeMirror from 'codemirror';

function isPosInSideToken(pos, token) {
    if (pos.ch === token.start) {
        return pos.xRel >= 0;
    }

    if (pos.ch === token.end) {
        return pos.xRel <= 0;
    }

    return true;
}

class TextHoverState {
    private options;
    private cm;
    private node;

    public constructor(cm, options) {
        this.options = options;
        this.cm = cm;
        this.node = null;
    }

    @bind
    public onMouseMove(e) {
        const node = e.target || e.srcElement;
        if (node && !node.classList.contains('CodeMirror-hover')) {
            this.node = node;
            this.onTextHover(this.cm, node, e);
        }
    }

    @bind
    public onTextHover(cm, node, e) {
        const mouseCoord = {
            left: e.pageX,
            top: e.pageY,
        };
        const pos = cm.coordsChar(mouseCoord);

        const token = cm.getTokenAt(pos);
        if (!token) {
            return;
        }

        const posInSideToken = isPosInSideToken(pos, token);

        if (posInSideToken) {
            this.options.onTextHover(cm, node, e, pos, token);
        }
    }
}

function parseOptions(cm, options) {
    if (options instanceof Function) {
        return {
            onTextHover: options,
        };
    }
    if (!options || options === true) {
        options = {};
    }

    if (!options.onTextHover) {
        options.onTextHover = cm.getHelper(CodeMirror.Pos(0, 0), 'textHover');
    }
    if (!options.onTextHover) {
        // Seems like it would never happen
        throw new Error(
            "Required option 'onTextHover' missing (text-hover addon)"
        );
    }

    return options;
}

CodeMirror.defineOption('textHover', false, (cm, val, old) => {
    if (old && old !== (CodeMirror as any).Init) {
        CodeMirror.off(
            cm.getWrapperElement(),
            'mousemove',
            cm.state.textHover.onMouseMove
        );
        delete cm.state.textHover;
    }

    if (val) {
        const state = (cm.state.textHover = new TextHoverState(
            cm,
            parseOptions(cm, val)
        ));
        CodeMirror.on(cm.getWrapperElement(), 'mousemove', state.onMouseMove);
    }
});

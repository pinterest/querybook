import * as DraftJs from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';

// Used mainly for chart descriptions, which could still be strings or raw
export function convertRawToContentState(
    raw: string,
    defaultVal = ''
): DraftJs.ContentState {
    try {
        if (raw) {
            const result = JSON.parse(raw);
            return DraftJs.convertFromRaw(result);
        } else {
            return DraftJs.ContentState.createFromText(defaultVal);
        }
    } catch (e) {
        return stateFromHTML(raw || '');
    }
}

export function convertContentStateToHTML(contentState: DraftJs.ContentState) {
    return stateToHTML(contentState);
}

export function convertIfContentStateToHTML(
    context: DraftJs.ContentState | string
) {
    return context != null
        ? typeof context === 'string'
            ? context
            : convertContentStateToHTML(context)
        : undefined;
}

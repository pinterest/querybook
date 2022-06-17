import clsx from 'clsx';
import * as DraftJs from 'draft-js';
import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

import { DraftJsSearchHighlighter } from 'components/SearchAndReplace/DraftJsSearchHighlighter';
import { IDataCellMetaBase } from 'const/datadoc';
import { SearchAndReplaceContext } from 'context/searchAndReplace';
import { useDebounceState } from 'hooks/redux/useDebounceState';
import { KeyMap, matchKeyMap } from 'lib/utils/keyboard';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';

import './DataDocTextCell.scss';

interface IProps {
    cellId: number;

    context: DraftJs.ContentState;
    meta: IDataCellMetaBase;
    isEditable: boolean;

    shouldFocus: boolean;

    onChange: (fields: {
        context?: string | DraftJs.ContentState;
        meta?: IDataCellMetaBase;
    }) => any;
    onDeleteKeyPressed?: () => any;
    onFocus?: () => any;
    onBlur?: () => any;
    onUpKeyPressed?: () => any;
    onDownKeyPressed?: () => any;
}

export const DataDocTextCell = React.memo<IProps>(
    ({
        cellId,
        context,
        // meta,
        isEditable,
        shouldFocus,
        onChange,
        onDeleteKeyPressed,
        onFocus,
        onBlur,
        onUpKeyPressed,
        onDownKeyPressed,
    }) => {
        const searchContext = useContext(SearchAndReplaceContext);
        const [focused, setFocused] = useState(false);
        const editorRef = useRef<RichTextEditor>(null);

        const onChangeContext = useCallback(
            (newContext: DraftJs.ContentState) => {
                onChange({ context: newContext });
            },
            [onChange]
        );
        const [debouncedContext, setDebouncedContext] = useDebounceState(
            context,
            onChangeContext,
            500
        );

        const focus = useCallback(() => {
            editorRef.current?.focus();
        }, []);

        useEffect(() => {
            if (shouldFocus !== focused) {
                if (!focused) {
                    focus();
                }

                setFocused(shouldFocus);
            }
        }, [shouldFocus]);

        const handleChange = useCallback((editorState: DraftJs.EditorState) => {
            setDebouncedContext(editorState.getCurrentContent());
        }, []);

        const handleTextCellClick = useCallback(() => {
            if (!focused) {
                focus();
            }
        }, [focused]);

        const handleBlur = useCallback(() => {
            if (focused && onBlur) {
                onBlur();
            }
        }, [focused, onBlur]);
        const handleFocus = useCallback(() => {
            if (!focused && onFocus) {
                onFocus();
            }
        }, [focused, onFocus]);

        const handleKeyDown = useCallback(
            (event: React.KeyboardEvent, editorState: DraftJs.EditorState) => {
                let handled = false;
                if (matchKeyMap(event, KeyMap.dataDoc.previousCell)) {
                    const firstBlockKey = editorState
                        .getCurrentContent()
                        .getBlockMap()
                        .first()
                        .getKey();
                    const selectionState = editorState.getSelection();
                    const cursorKey = selectionState.getAnchorKey();

                    const atFirstLine = cursorKey === firstBlockKey;
                    const startOfLine = selectionState.getAnchorOffset() === 0;

                    if (atFirstLine && startOfLine && onUpKeyPressed) {
                        onUpKeyPressed();
                        handled = true;
                    }
                } else if (matchKeyMap(event, KeyMap.dataDoc.nextCell)) {
                    const lastBlock = editorState
                        .getCurrentContent()
                        .getBlockMap()
                        .last();
                    const lastBlockKey = lastBlock.getKey();
                    const selectionState = editorState.getSelection();
                    const cursorKey = selectionState.getAnchorKey();

                    const atLastLine = cursorKey === lastBlockKey;
                    const endOfLine =
                        selectionState.getAnchorOffset() ===
                        lastBlock.getText().length;

                    if (atLastLine && endOfLine && onDownKeyPressed) {
                        onDownKeyPressed();
                        handled = true;
                    }
                } else if (matchKeyMap(event, KeyMap.richText.deleteCell)) {
                    onDeleteKeyPressed?.();
                    handled = true;
                } else if (matchKeyMap(event, KeyMap.dataDoc.openSearch)) {
                    searchContext.showSearchAndReplace();
                    handled = true;
                } else if (matchKeyMap(event, KeyMap.dataDoc.closeSearch)) {
                    searchContext.hideSearchAndReplace();
                    handled = true;
                }

                return handled;
            },
            [onUpKeyPressed, onDownKeyPressed, onDeleteKeyPressed]
        );

        const className = clsx({
            DataDocTextCell: true,
            editable: isEditable,
        });

        return (
            <div className={className} onClick={handleTextCellClick}>
                <RichTextEditor
                    value={debouncedContext}
                    ref={editorRef}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    readOnly={!isEditable}
                />
                <DraftJsSearchHighlighter
                    searchContext={searchContext}
                    editor={editorRef.current}
                    cellId={cellId}
                />
            </div>
        );
    }
);

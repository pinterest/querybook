import clsx from 'clsx';
import { VisibilityProperty } from 'csstype';
import * as DraftJs from 'draft-js';
import { List } from 'immutable';
import React, {
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import { useStateWithRef } from 'hooks/useStateWithRef';
import {
    isContentStateInUndoStack,
    isListBlock,
    isSoftNewLineEvent,
    LinkDecorator,
    RichTextEditorCommand,
    RichTextEditorStyleMap,
} from 'lib/richtext';
import { Nullable } from 'lib/typescript';
import * as Utils from 'lib/utils';
import { KeyMap, matchKeyMap, matchKeyPress } from 'lib/utils/keyboard';
import {
    IRichTextEditorToolBarHandles,
    RichTextEditorToolBar,
} from 'ui/RichTextEditorToolBar/RichTextEditorToolBar';

import './RichTextEditor.scss';

const compositeDecorator = new DraftJs.CompositeDecorator([LinkDecorator]);
const MAX_LIST_DEPTH = 5;

export interface IRichTextEditorProps {
    className?: string;
    readOnly?: boolean;
    value: DraftJs.ContentState;
    placeholder?: string;

    onChange?: (editorState: DraftJs.EditorState) => any;
    onKeyDown?: (
        event: React.KeyboardEvent,
        editorState: DraftJs.EditorState
    ) => boolean;
    onFocus?: () => any;
    onBlur?: () => any;

    decorator?: DraftJs.CompositeDecorator;
    autoFocus?: boolean;
}

export interface IRichTextEditorState {
    editorState: DraftJs.EditorState;
    toolBarStyle: React.CSSProperties;
}

export interface IRichTextEditorHandles {
    focus: () => void;
    setContent: (contentState: DraftJs.ContentState) => void;
    getContent: () => DraftJs.ContentState;

    getEditorState: () => DraftJs.EditorState;
    setEditorState: (state: DraftJs.EditorState) => void;
    getDraftJsEditor: () => DraftJs.Editor;
}
interface IToolBarStyle {
    top?: number;
    left?: number;
    visibility: VisibilityProperty;
}

function calculateToolBarPosition(element: Nullable<HTMLElement>) {
    if (!element) {
        return null;
    }

    const toolBarHeight = element.clientHeight;
    const toolBarWidth = element.clientWidth;

    const selectionRect = Utils.getSelectionRect();
    if (selectionRect == null) {
        return null;
    }

    const position = {
        top: Math.max(selectionRect.top - toolBarHeight - 5, 0),
        left: Math.max(
            selectionRect.left + (selectionRect.width - toolBarWidth) / 2,
            0
        ),
    };
    return position;
}

function calculateToolBarStyle(
    selection: DraftJs.SelectionState,
    toolBarDiv: Nullable<HTMLElement>
): IToolBarStyle {
    const isVisible = !selection.isCollapsed() && selection.getHasFocus();
    const position =
        (isVisible ? calculateToolBarPosition(toolBarDiv) : null) || {};

    return {
        ...position,
        visibility: (isVisible ? 'visible' : 'hidden') as VisibilityProperty,
    };
}

export const RichTextEditor = React.forwardRef<
    IRichTextEditorHandles,
    IRichTextEditorProps
>(
    (
        {
            className,
            readOnly = false,
            value,
            placeholder,
            autoFocus,
            decorator,

            onChange,
            onKeyDown,
            onFocus,
            onBlur,
        },
        ref
    ) => {
        const [editorState, setEditorState, editorStateRef] = useStateWithRef(
            () =>
                DraftJs.EditorState.createWithContent(
                    value,
                    decorator ?? compositeDecorator
                )
        );

        const [toolBarStyle, setToolBarStyle] = useState<IToolBarStyle>({
            top: 0,
            left: 0,
            visibility: 'hidden',
        });

        const editorRef = useRef<DraftJs.Editor>();
        const toolBarRef = useRef<IRichTextEditorToolBarHandles>();
        const selfRef = useRef<HTMLDivElement>();

        const focus = useCallback(() => {
            if (editorRef.current && toolBarRef.current) {
                editorRef.current.focus();
                setToolBarStyle(
                    calculateToolBarStyle(
                        editorState.getSelection(),
                        toolBarRef.current.getContainer()
                    )
                );
            }
        }, [editorState]);

        const handleChange = useCallback(
            (newEditorState: DraftJs.EditorState) => {
                setEditorState((oldEditorState) => {
                    const previousSelection = oldEditorState.getSelection();
                    const currentSelection = newEditorState.getSelection();
                    if (previousSelection !== currentSelection) {
                        setToolBarStyle(
                            calculateToolBarStyle(
                                currentSelection,
                                toolBarRef.current.getContainer()
                            )
                        );
                    }
                    onChange?.(newEditorState);
                    return newEditorState;
                });
            },
            [onChange, setEditorState]
        );

        const handleReturnSoftNewLine = useCallback(
            (editorState: DraftJs.EditorState, event: React.KeyboardEvent) => {
                const selection = editorState.getSelection();

                if (isSoftNewLineEvent(event) && selection.isCollapsed()) {
                    handleChange(
                        DraftJs.RichUtils.insertSoftNewline(editorState)
                    );
                    return true;
                }
                return false;
            },
            [handleChange]
        );

        const handleReturnList = useCallback(
            (editorState: DraftJs.EditorState) => {
                const selection = editorState.getSelection();

                if (selection.isCollapsed()) {
                    const contentState = editorState.getCurrentContent();
                    const blockKey = selection.getStartKey();
                    const block = contentState.getBlockForKey(blockKey);
                    const blockType = block.getType();
                    const isListType = isListBlock(blockType);

                    if (isListType && block.getLength() === 0) {
                        const depth = block.getDepth();
                        let newEditorState: DraftJs.EditorState;

                        if (depth === 0) {
                            // Change block from list to unstyle
                            const newBlock = block.set(
                                'type',
                                'unstyled'
                            ) as DraftJs.ContentBlock;
                            const newContentState = contentState.merge({
                                blockMap: contentState
                                    .getBlockMap()
                                    .set(blockKey, newBlock),
                            }) as DraftJs.ContentState;
                            newEditorState = DraftJs.EditorState.push(
                                editorState,
                                newContentState,
                                'change-block-type'
                            );
                        } else {
                            // Reduce depth of list by 1
                            const newBlock = block.set(
                                'depth',
                                depth - 1
                            ) as DraftJs.ContentBlock;
                            const newContentState = contentState.merge({
                                blockMap: contentState
                                    .getBlockMap()
                                    .set(blockKey, newBlock),
                            }) as DraftJs.ContentState;
                            newEditorState = DraftJs.EditorState.push(
                                editorState,
                                newContentState,
                                'adjust-depth'
                            );
                        }
                        handleChange(newEditorState);
                        return true;
                    }
                }

                return false;
            },
            [handleChange]
        );

        const handleReturnSpecialBlock = useCallback(
            (editorState: DraftJs.EditorState) => {
                const selection = editorState.getSelection();

                if (selection.isCollapsed()) {
                    const contentState = editorState.getCurrentContent();
                    const blockKey = selection.getStartKey();
                    const block = contentState.getBlockForKey(blockKey);
                    const blockType = block.getType();
                    const isSpecialBlock =
                        !isListBlock(blockType) && blockType !== 'unstyled';

                    if (
                        isSpecialBlock &&
                        block.getLength() === selection.getStartOffset()
                    ) {
                        // If cursor is at the end
                        // Insert a new block after current block
                        const blockMap = contentState.getBlockMap();
                        const blockSeq = blockMap.toSeq();
                        const blocksBefore = blockSeq.takeUntil(
                            (b) => b === block
                        );
                        const blocksAfter = blockSeq
                            .skipUntil((b) => b === block)
                            .rest();
                        const newBlockKey = DraftJs.genKey();
                        const newBlock = new DraftJs.ContentBlock({
                            key: newBlockKey,
                            type: 'unstyled',
                            text: '',
                            characterList: List(),
                        });
                        const newBlockMap = blocksBefore
                            .concat(
                                [
                                    [blockKey, block],
                                    [newBlockKey, newBlock],
                                ],
                                blocksAfter
                            )
                            .toOrderedMap();
                        const newContentState = contentState.merge({
                            blockMap: newBlockMap,
                            selectionBefore: selection,
                            selectionAfter: selection.merge({
                                anchorKey: newBlockKey,
                                anchorOffset: 0,
                                focusKey: newBlockKey,
                                focusOffset: 0,
                                isBackward: false,
                            }),
                        }) as DraftJs.ContentState;
                        const newEditorState = DraftJs.EditorState.push(
                            editorState,
                            newContentState,
                            'split-block'
                        );
                        handleChange(newEditorState);
                        return true;
                    }
                }

                return false;
            },
            [handleChange]
        );

        const handleInputLink = useCallback(
            (editorState: DraftJs.EditorState) => {
                const selectionState = editorState.getSelection();
                const anchorKey = selectionState.getAnchorKey();
                const currentContent = editorState.getCurrentContent();
                const currentBlock = currentContent.getBlockForKey(anchorKey);
                const end = selectionState.getEndOffset();
                const textBeforeSelection = currentBlock
                    .getText()
                    .slice(0, end);
                const urlMatch = textBeforeSelection.match(/[^\s]+$/);
                const url = urlMatch ? urlMatch[0] : '';
                if (!url.startsWith('https://') && !url.startsWith('http://')) {
                    return editorState;
                }
                const start = urlMatch.index;

                // If the text is already a link do not toggle.
                const entityAtStart = currentBlock.getEntityAt(start);
                const isAlreadyLink =
                    entityAtStart !== null &&
                    currentContent.getEntity(entityAtStart).getType() ===
                        'LINK';

                if (isAlreadyLink) {
                    return editorState;
                }

                // Create link entity connected to text starting with https:// or http://
                const contentStateWithEntity = currentContent.createEntity(
                    'LINK',
                    'MUTABLE',
                    { url }
                );
                const entityKey =
                    contentStateWithEntity.getLastCreatedEntityKey();
                const newEditorState = DraftJs.EditorState.push(
                    editorState,
                    contentStateWithEntity,
                    'apply-entity'
                );

                const emptySelectionState =
                    DraftJs.SelectionState.createEmpty(anchorKey);
                const linkSelectionState = emptySelectionState.merge({
                    anchorOffset: start,
                    focusKey: anchorKey,
                    focusOffset: end,
                });
                // Selection state at end of url to move cursor to end of link
                const endSelectionState = emptySelectionState.merge({
                    anchorOffset: end,
                    focusKey: anchorKey,
                    focusOffset: end,
                    hasFocus: true,
                });
                const newEditorStateWithLink =
                    DraftJs.EditorState.forceSelection(
                        DraftJs.RichUtils.toggleLink(
                            newEditorState,
                            linkSelectionState as DraftJs.SelectionState,
                            entityKey
                        ),
                        endSelectionState as DraftJs.SelectionState
                    );
                handleChange(newEditorStateWithLink);
                return newEditorStateWithLink;
            },
            [handleChange]
        );

        const handleReturn = useCallback(
            (event: React.KeyboardEvent) => {
                const newEditorStateWithLink = handleInputLink(
                    editorStateRef.current
                );
                if (handleReturnSoftNewLine(newEditorStateWithLink, event)) {
                    return 'handled';
                }
                if (handleReturnList(newEditorStateWithLink)) {
                    return 'handled';
                }
                if (handleReturnSpecialBlock(newEditorStateWithLink)) {
                    return 'handled';
                }
                if (newEditorStateWithLink !== editorStateRef.current) {
                    return 'handled';
                }
                return 'not-handled';
            },
            [
                editorStateRef,
                handleInputLink,
                handleReturnSoftNewLine,
                handleReturnList,
                handleReturnSpecialBlock,
            ]
        );

        const handleBeforeInput = useCallback(
            (chars: string, editorState: DraftJs.EditorState) => {
                if (/\s/.test(chars)) {
                    // Convert links to url if applicable
                    const newEditorStateWithLink = handleInputLink(editorState);
                    if (newEditorStateWithLink === editorState) {
                        return 'not-handled';
                    }

                    // Insert original character that was input
                    const newContentState = DraftJs.Modifier.replaceText(
                        newEditorStateWithLink.getCurrentContent(),
                        newEditorStateWithLink.getSelection(),
                        chars
                    );
                    const newEditorStateWithChars = DraftJs.EditorState.push(
                        newEditorStateWithLink,
                        newContentState,
                        'insert-characters'
                    );
                    handleChange(newEditorStateWithChars);
                    return 'handled';
                }
                return 'not-handled';
            },
            [handleChange, handleInputLink]
        );

        const handleTab = useCallback(
            (event: React.KeyboardEvent) => {
                const newEditorState = DraftJs.RichUtils.onTab(
                    event,
                    editorStateRef.current,
                    MAX_LIST_DEPTH
                );
                if (newEditorState !== editorStateRef.current) {
                    handleChange(newEditorState);
                } else {
                    const newEditorStateWithLink = handleInputLink(
                        editorStateRef.current
                    );
                    const newContentState = DraftJs.Modifier.replaceText(
                        newEditorStateWithLink.getCurrentContent(),
                        newEditorStateWithLink.getSelection(),
                        '    '
                    );
                    const newEditorStateWithTab = DraftJs.EditorState.push(
                        newEditorStateWithLink,
                        newContentState,
                        'insert-characters'
                    );
                    handleChange(newEditorStateWithTab);
                }
            },
            [handleChange, handleInputLink, editorStateRef]
        );

        const keyBindingFn = useCallback(
            (e: React.KeyboardEvent): RichTextEditorCommand => {
                let handled = false;
                let command: RichTextEditorCommand = null;

                // parent component key presses
                if (onKeyDown) {
                    handled = onKeyDown(e, editorState);
                }

                // Default key presses
                if (!handled) {
                    if (matchKeyPress(e, 'Tab')) {
                        handleTab(e);
                        handled = true;
                    } else if (matchKeyMap(e, KeyMap.richText.strikethrough)) {
                        // Cmd+Shift+X
                        command = 'strikethrough';
                        handled = true;
                    } else if (matchKeyMap(e, KeyMap.richText.addLink)) {
                        command = 'show-link-input';
                        handled = true;
                    } else if (matchKeyMap(e, KeyMap.richText.bold)) {
                        command = 'bold';
                        handled = true;
                    } else if (matchKeyMap(e, KeyMap.richText.italics)) {
                        command = 'italic';
                        handled = true;
                    }
                }

                // Fall through to default behavior
                if (!handled) {
                    command = DraftJs.getDefaultKeyBinding(e);
                    handled = !!command;
                }

                // stop event progation if the event is
                // either handled by default behavior or custom behaivor
                if (handled) {
                    e.stopPropagation();
                    e.preventDefault();
                }

                return command;
            },
            [onKeyDown, editorState, handleTab]
        );

        const handleKeyCommand = useCallback(
            (
                command: RichTextEditorCommand,
                editorState: DraftJs.EditorState
            ) => {
                switch (command) {
                    case 'show-link-input': {
                        if (!editorState.getSelection().isCollapsed()) {
                            toolBarRef.current.showLinkInput();
                            return 'handled';
                        }
                    }
                    case 'strikethrough': {
                        handleChange(
                            DraftJs.RichUtils.toggleInlineStyle(
                                editorState,
                                'STRIKETHROUGH'
                            )
                        );
                        return 'handled';
                    }
                    default: {
                        const newState = DraftJs.RichUtils.handleKeyCommand(
                            editorState,
                            command
                        );

                        if (newState) {
                            handleChange(newState);
                            return 'handled';
                        }
                    }
                }

                return 'not-handled';
            },
            [handleChange]
        );

        useEffect(() => {
            if (autoFocus) {
                focus();
            }
            // only on mount, focus
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        useEffect(() => {
            if (
                value !== editorState.getCurrentContent() &&
                !isContentStateInUndoStack(value, editorState.getUndoStack())
            ) {
                const newEditorState = DraftJs.EditorState.push(
                    editorState,
                    value,
                    'apply-entity'
                );
                setEditorState(newEditorState);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [value]);

        useImperativeHandle(
            ref,
            () => ({
                focus,
                getContent: () => editorStateRef.current.getCurrentContent(),
                setContent: (contentState) =>
                    setEditorState(
                        DraftJs.EditorState.createWithContent(
                            contentState,
                            compositeDecorator
                        )
                    ),
                getEditorState: () => editorStateRef.current,
                setEditorState,
                getDraftJsEditor: () => editorRef.current,
            }),
            [editorStateRef, setEditorState, focus]
        );

        const toolBar = readOnly ? null : (
            <div className="toolbar-wrapper" style={toolBarStyle}>
                <RichTextEditorToolBar
                    ref={toolBarRef}
                    editorState={editorState}
                    focusEditor={focus}
                    onChange={handleChange}
                />
            </div>
        );

        const editor = (
            <DraftJs.Editor
                editorState={editorState}
                placeholder={placeholder}
                keyBindingFn={keyBindingFn}
                handleKeyCommand={handleKeyCommand}
                onChange={handleChange}
                onFocus={onFocus}
                onBlur={onBlur}
                ref={editorRef}
                handleReturn={handleReturn}
                readOnly={readOnly}
                spellCheck={true}
                handleBeforeInput={handleBeforeInput}
                customStyleMap={RichTextEditorStyleMap}
            />
        );

        const editorClassName = clsx({
            RichTextEditor: true,
            [className]: className,
        });

        return (
            <div className={editorClassName} ref={selfRef}>
                {toolBar}
                {editor}
            </div>
        );
    }
);

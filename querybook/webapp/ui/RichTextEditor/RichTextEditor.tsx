import clsx from 'clsx';
import { VisibilityProperty } from 'csstype';
import * as DraftJs from 'draft-js';
import { List } from 'immutable';
import { bind } from 'lodash-decorators';
import React from 'react';

import {
    isContentStateInUndoStack,
    isListBlock,
    isSoftNewLineEvent,
    LinkDecorator,
    RichTextEditorCommand,
    RichTextEditorStyleMap,
} from 'lib/richtext';
import * as Utils from 'lib/utils';
import { KeyMap, matchKeyMap, matchKeyPress } from 'lib/utils/keyboard';
import { RichTextEditorToolBar } from 'ui/RichTextEditorToolBar/RichTextEditorToolBar';

import './RichTextEditor.scss';

const compositeDecorator = new DraftJs.CompositeDecorator([LinkDecorator]);
const MAX_LIST_DEPTH = 5;

export interface IRichTextEditorProps {
    className?: string;
    readOnly?: boolean;
    value: DraftJs.ContentState;

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

export class RichTextEditor extends React.PureComponent<
    IRichTextEditorProps,
    IRichTextEditorState
> {
    public static defaultProps: Partial<IRichTextEditorProps> = {
        readOnly: false,
    };

    public readonly state = {
        editorState: DraftJs.EditorState.createWithContent(
            this.props.value,
            this.props.decorator ?? compositeDecorator
        ),
        toolBarStyle: {
            top: 0,
            left: 0,
            visibility: 'hidden' as 'hidden',
        },
    };

    private editorRef = React.createRef<DraftJs.Editor>();
    private toolBarRef = React.createRef<RichTextEditorToolBar>();
    private selfRef = React.createRef<HTMLDivElement>();

    public get draftJSEditor() {
        return this.editorRef.current;
    }

    public get editorState() {
        return this.state.editorState;
    }

    public set editorState(editorState: DraftJs.EditorState) {
        this.setState({
            editorState,
        });
    }

    @bind
    public focus() {
        if (this.editorRef) {
            this.editorRef.current.focus();
            this.setState({
                toolBarStyle: this.calculateToolBarStyle(
                    this.state.editorState.getSelection()
                ),
            });
        }
    }

    @bind
    public calculateToolBarPosition() {
        if (!this.toolBarRef.current?.selfRef) {
            return null;
        }
        const toolBarDivRef = this.toolBarRef.current.selfRef;

        const toolBarHeight = toolBarDivRef.current.clientHeight;
        const toolBarWidth = toolBarDivRef.current.clientWidth;

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

    @bind
    public calculateToolBarStyle(selection: DraftJs.SelectionState) {
        const isVisible = !selection.isCollapsed() && selection.getHasFocus();
        const position =
            (isVisible ? this.calculateToolBarPosition() : null) || {};

        return {
            ...position,
            visibility: (isVisible
                ? 'visible'
                : 'hidden') as VisibilityProperty,
        };
    }

    @bind
    public onChange(editorState: DraftJs.EditorState) {
        const previousSelection = this.state.editorState.getSelection();
        this.setState({ editorState }, () => {
            const currentSelection = editorState.getSelection();
            if (previousSelection !== currentSelection) {
                this.setState({
                    toolBarStyle: this.calculateToolBarStyle(currentSelection),
                });
            }
            if (this.props.onChange) {
                this.props.onChange(editorState);
            }
        });
    }

    @bind
    public handleReturnSoftNewLine(
        editorState: DraftJs.EditorState,
        event: React.KeyboardEvent
    ) {
        const selection = editorState.getSelection();

        if (isSoftNewLineEvent(event) && selection.isCollapsed()) {
            this.onChange(DraftJs.RichUtils.insertSoftNewline(editorState));
            return true;
        }
        return false;
    }

    @bind
    public handleReturnList(editorState: DraftJs.EditorState) {
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
                this.onChange(newEditorState);
                return true;
            }
        }

        return false;
    }

    @bind
    public handleReturnSpecialBlock(editorState: DraftJs.EditorState) {
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
                const blocksBefore = blockSeq.takeUntil((b) => b === block);
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
                this.onChange(newEditorState);
                return true;
            }
        }

        return false;
    }

    @bind
    public handleReturn(event: React.KeyboardEvent) {
        const { editorState } = this.state;
        const newEditorStateWithLink = this.handleInputLink(editorState);
        if (this.handleReturnSoftNewLine(newEditorStateWithLink, event)) {
            return 'handled';
        }
        if (this.handleReturnList(newEditorStateWithLink)) {
            return 'handled';
        }
        if (this.handleReturnSpecialBlock(newEditorStateWithLink)) {
            return 'handled';
        }
        if (newEditorStateWithLink !== editorState) {
            return 'handled';
        }
        return 'not-handled';
    }

    @bind
    public handleInputLink(editorState: DraftJs.EditorState) {
        const selectionState = editorState.getSelection();
        const anchorKey = selectionState.getAnchorKey();
        const currentContent = editorState.getCurrentContent();
        const currentBlock = currentContent.getBlockForKey(anchorKey);
        const end = selectionState.getEndOffset();
        const textBeforeSelection = currentBlock.getText().slice(0, end);
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
            currentContent.getEntity(entityAtStart).getType() === 'LINK';

        if (isAlreadyLink) {
            return editorState;
        }

        // Create link entity connected to text starting with https:// or http://
        const contentStateWithEntity = currentContent.createEntity(
            'LINK',
            'MUTABLE',
            { url }
        );
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
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
        const newEditorStateWithLink = DraftJs.EditorState.forceSelection(
            DraftJs.RichUtils.toggleLink(
                newEditorState,
                linkSelectionState as DraftJs.SelectionState,
                entityKey
            ),
            endSelectionState as DraftJs.SelectionState
        );
        this.onChange(newEditorStateWithLink);
        return newEditorStateWithLink;
    }

    @bind
    public handleBeforeInput(chars: string, editorState: DraftJs.EditorState) {
        if (/\s/.test(chars)) {
            // Convert links to url if applicable
            const newEditorStateWithLink = this.handleInputLink(editorState);
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
            this.onChange(newEditorStateWithChars);
            return 'handled';
        }
        return 'not-handled';
    }

    @bind
    public onTab(event: React.KeyboardEvent) {
        const { editorState } = this.state;
        const newEditorState = DraftJs.RichUtils.onTab(
            event,
            editorState,
            MAX_LIST_DEPTH
        );
        if (newEditorState !== editorState) {
            this.onChange(newEditorState);
        } else {
            const newEditorStateWithLink = this.handleInputLink(editorState);
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
            this.onChange(newEditorStateWithTab);
        }
    }

    @bind
    public keyBindingFn(e: React.KeyboardEvent): RichTextEditorCommand {
        let handled = false;
        let command: RichTextEditorCommand = null;

        // parent component key presses
        if (this.props.onKeyDown) {
            handled = this.props.onKeyDown(e, this.state.editorState);
        }

        // Default key presses
        if (!handled) {
            if (matchKeyPress(e, 'Tab')) {
                this.onTab(e);
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
    }

    @bind
    public handleKeyCommand(
        command: RichTextEditorCommand,
        editorState: DraftJs.EditorState
    ) {
        switch (command) {
            case 'show-link-input': {
                if (!editorState.getSelection().isCollapsed()) {
                    this.toolBarRef.current.showLinkInput();
                    return 'handled';
                }
            }
            case 'strikethrough': {
                this.onChange(
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
                    this.onChange(newState);
                    return 'handled';
                }
            }
        }

        return 'not-handled';
    }

    public componentDidMount() {
        if (this.props.autoFocus) {
            this.focus();
        }
    }

    public componentDidUpdate(prevProps: IRichTextEditorProps) {
        if (
            prevProps.value !== this.props.value &&
            this.props.value !== this.state.editorState.getCurrentContent() &&
            // This shouldn't happen, but just in case
            !isContentStateInUndoStack(
                this.props.value,
                this.state.editorState.getUndoStack(),
                5
            )
        ) {
            const newEditorState = DraftJs.EditorState.push(
                this.state.editorState,
                this.props.value,
                'apply-entity'
            );
            this.setState({
                editorState: newEditorState,
            });
        }
    }

    public componentDidCatch() {
        // Suppressing error due to LinkDecorator failing on delete
        // related github issue https://github.com/facebook/draft-js/issues/1320#issuecomment-476509968
        this.forceUpdate();
    }

    public getContent() {
        return this.state.editorState.getCurrentContent();
    }

    public setContent(contentState: DraftJs.ContentState) {
        this.setState({
            editorState: DraftJs.EditorState.createWithContent(
                contentState,
                compositeDecorator
            ),
        });
    }

    public render() {
        const { className, onFocus, onBlur, readOnly } = this.props;

        const { editorState, toolBarStyle } = this.state;
        const toolBar = readOnly ? null : (
            <div className="toolbar-wrapper" style={toolBarStyle}>
                <RichTextEditorToolBar
                    ref={this.toolBarRef}
                    editorState={editorState}
                    focusEditor={this.focus}
                    onChange={this.onChange}
                />
            </div>
        );

        const editor = (
            <DraftJs.Editor
                editorState={editorState}
                keyBindingFn={this.keyBindingFn}
                handleKeyCommand={this.handleKeyCommand}
                onChange={this.onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                ref={this.editorRef}
                handleReturn={this.handleReturn}
                readOnly={readOnly}
                spellCheck={true}
                handleBeforeInput={this.handleBeforeInput}
                customStyleMap={RichTextEditorStyleMap}
            />
        );

        const editorClassName = clsx({
            RichTextEditor: true,
            [className]: className,
        });

        return (
            <div className={editorClassName} ref={this.selfRef}>
                {toolBar}
                {editor}
            </div>
        );
    }
}

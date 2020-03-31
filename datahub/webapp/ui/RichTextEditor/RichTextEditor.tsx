import { VisibilityProperty } from 'csstype';
import classNames from 'classnames';
import { bind } from 'lodash-decorators';
import * as DraftJs from 'draft-js';
import { List } from 'immutable';
import React from 'react';
import {
    LinkDecorator,
    isSoftNewLineEvent,
    isListBlock,
} from 'lib/draft-js-utils';
import * as Utils from 'lib/utils';

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
    ) => any;
    onFocus?: () => any;
    onBlur?: () => any;
}

export interface IRichTextEditorState {
    editorState: DraftJs.EditorState;
    toolBarStyle: React.CSSProperties;
}

export class RichTextEditor extends React.Component<
    IRichTextEditorProps,
    IRichTextEditorState
> {
    public static defaultProps: Partial<IRichTextEditorProps> = {
        readOnly: false,
    };

    public readonly state = {
        editorState: DraftJs.EditorState.createWithContent(
            this.props.value,
            compositeDecorator
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
        if (!this.toolBarRef || !this.toolBarRef.current.selfRef) {
            return null;
        }
        const toolBarDivRef = this.toolBarRef.current.selfRef;

        const toolBarHeight = toolBarDivRef.current.clientHeight;
        const toolBarWidth = toolBarDivRef.current.clientWidth;

        const selectionRect = Utils.getSelectionRect();
        if (selectionRect == null) {
            return null;
        }

        const relativeElement = this.selfRef.current;
        const relativeRect = relativeElement.getBoundingClientRect();

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
        this.setState((state) => {
            const previousSelection = state.editorState.getSelection();
            const currentSelection = editorState.getSelection();
            const toolBarStyle =
                previousSelection !== currentSelection
                    ? this.calculateToolBarStyle(currentSelection)
                    : state.toolBarStyle;

            return {
                ...state,
                editorState,
                toolBarStyle,
            };
        });
        if (this.props.onChange) {
            this.props.onChange(editorState);
        }
    }

    @bind
    public handleReturnSoftNewLine(event: React.KeyboardEvent) {
        const { editorState } = this.state;
        const selection = editorState.getSelection();

        if (isSoftNewLineEvent(event) && selection.isCollapsed()) {
            this.onChange(DraftJs.RichUtils.insertSoftNewline(editorState));
            return true;
        }
        return false;
    }

    @bind
    public handleReturnList() {
        const { editorState } = this.state;
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
    public handleReturnSpecialBlock() {
        const { editorState } = this.state;
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
        if (this.handleReturnSoftNewLine(event)) {
            return 'handled';
        }
        if (this.handleReturnList()) {
            return 'handled';
        }
        if (this.handleReturnSpecialBlock()) {
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
            event.preventDefault();
            const newContentState = DraftJs.Modifier.replaceText(
                editorState.getCurrentContent(),
                editorState.getSelection(),
                '    '
            );
            const newEditorStateWithTab = DraftJs.EditorState.push(
                editorState,
                newContentState,
                'insert-characters'
            );
            this.onChange(newEditorStateWithTab);
        }
    }

    @bind
    public keyBindingFn(e: React.KeyboardEvent) {
        if (
            (e.keyCode === 8 || e.keyCode === 38 || e.keyCode === 40) &&
            this.props.onKeyDown
        ) {
            // Delete, Up arrow, down arrow
            this.props.onKeyDown(e, this.state.editorState);
        } else if (e.keyCode === 9) {
            this.onTab(e);
        }
        return DraftJs.getDefaultKeyBinding(e);
    }

    @bind
    public handleKeyCommand(command: string, editorState: DraftJs.EditorState) {
        const newState = DraftJs.RichUtils.handleKeyCommand(
            editorState,
            command
        );
        if (newState) {
            this.onChange(newState);
            return 'handled';
        }
        return 'not-handled';
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
            />
        );

        const editorClassName = classNames({
            RichTextEditor: true,
            [className]: className,
            content: true,
        });

        return (
            <div className={editorClassName} ref={this.selfRef}>
                {toolBar}
                {editor}
            </div>
        );
    }
}

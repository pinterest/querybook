import * as DraftJs from 'draft-js';
import { debounce, bind } from 'lodash-decorators';
import React, { useContext, useMemo, useEffect } from 'react';
import classNames from 'classnames';
import scrollIntoView from 'smooth-scroll-into-view-if-needed';

import { DataDocContext } from 'context/DataDoc';
import { LinkDecorator } from 'lib/draft-js-utils';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { makeSearchHighlightDecorator } from './SearchHighlightDecorator';
import './DataDocTextCell.scss';

interface IProps {
    cellId: number;

    context: DraftJs.ContentState;
    meta: {};
    isEditable: boolean;

    shouldFocus: boolean;

    onChange: (fields: {
        context?: string | DraftJs.ContentState;
        meta?: {};
    }) => any;
    onDeleteKeyPressed?: () => any;
    onFocus?: () => any;
    onBlur?: () => any;
    onUpKeyPressed?: () => any;
    onDownKeyPressed?: () => any;
}

interface IState {
    focused: boolean;
}

export class DataDocTextCell extends React.Component<IProps, IState> {
    public readonly state = {
        focused: false,
    };

    private editorRef = React.createRef<RichTextEditor>();
    private updating = false;

    public componentDidMount() {
        this.updateFocus();
    }

    public componentDidUpdate(prevProps) {
        this.updateFocus();

        if (prevProps.context !== this.props.context) {
            if (this.updating) {
                this.updating = false;
            } else if (this.editorRef.current) {
                this.editorRef.current.setContent(this.props.context);
            }
        }
    }

    @bind
    @debounce(500)
    public handleChange(editorState: DraftJs.EditorState) {
        const context = editorState.getCurrentContent();
        if (this.props.context !== context) {
            this.updating = true;
            this.props.onChange({ context });
        }
    }

    public updateFocus() {
        if (this.props.shouldFocus !== this.state.focused) {
            if (!this.state.focused) {
                this.focus();
            }

            this.setState({
                focused: this.props.shouldFocus,
            });
        }
    }

    @bind
    public handleTextCellClick() {
        if (!this.state.focused) {
            this.focus();
        }
    }

    @bind
    public onBlur() {
        if (this.state.focused) {
            if (this.props.onBlur) {
                this.props.onBlur();
            }
        }
    }

    @bind
    public onFocus() {
        if (!this.state.focused) {
            if (this.props.onFocus) {
                this.props.onFocus();
            }
        }
    }

    @bind
    public focus() {
        const editorRef = this.editorRef;
        if (editorRef.current) {
            editorRef.current.focus();
        }
    }

    @bind
    public handleKeyDown(event, editorState) {
        const keyUpCode = 38;
        const keyDownCode = 40;
        const keyDeleteCode = 8;

        let stopEvent = false;
        if (event.keyCode === keyUpCode) {
            const firstBlockKey = editorState
                .getCurrentContent()
                .getBlockMap()
                .first()
                .getKey();
            const selectionState = editorState.getSelection();
            const cursorKey = selectionState.getAnchorKey();

            const atFirstLine = cursorKey === firstBlockKey;
            const startOfLine = selectionState.getAnchorOffset() === 0;

            if (atFirstLine && startOfLine) {
                if (this.props.onUpKeyPressed) {
                    this.props.onUpKeyPressed();
                }
                stopEvent = true;
            }
        } else if (event.keyCode === keyDownCode) {
            const lastBlock = editorState
                .getCurrentContent()
                .getBlockMap()
                .last();
            const lastBlockKey = lastBlock.getKey();
            const selectionState = editorState.getSelection();
            const cursorKey = selectionState.getAnchorKey();

            const atLastLine = cursorKey === lastBlockKey;
            const endOfLine =
                selectionState.getAnchorOffset() === lastBlock.getText().length;

            if (atLastLine && endOfLine) {
                if (this.props.onDownKeyPressed) {
                    this.props.onDownKeyPressed();
                    stopEvent = true;
                }
            }
        } else if (event.keyCode === keyDeleteCode) {
            if (!editorState.getCurrentContent().hasText()) {
                this.props.onDeleteKeyPressed();
                stopEvent = true;
            }
        }

        if (stopEvent) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    public render() {
        const className = classNames({
            DataDocTextCell: true,
            editable: this.props.isEditable,
        });

        return (
            <div className={className} onClick={this.handleTextCellClick}>
                <RichTextEditor
                    value={this.props.context}
                    ref={this.editorRef}
                    onKeyDown={this.handleKeyDown}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    onChange={this.handleChange}
                    readOnly={!this.props.isEditable}
                />
                <SearchHighlighter
                    editor={this.editorRef.current}
                    cellId={this.props.cellId}
                />
            </div>
        );
    }
}

const SearchHighlighter: React.FC<{
    editor: RichTextEditor;
    cellId: number;
}> = ({ editor, cellId }) => {
    const {
        search: {
            searchState: {
                searchResults,
                searchString,
                searchOptions,
                currentSearchResultIndex,
            },
            focusSearchBar,
        },
    } = useContext(DataDocContext);

    const shouldHighlight = useMemo(
        () => editor && searchResults.some((r) => r.cellId === cellId),
        [searchResults, cellId, editor]
    );
    useEffect(() => {
        if (editor) {
            const decorators = [LinkDecorator];
            if (shouldHighlight) {
                decorators.push(
                    makeSearchHighlightDecorator(searchString, searchOptions)
                );
            }

            editor.editorState = DraftJs.EditorState.set(editor.editorState, {
                decorator: new DraftJs.CompositeDecorator(decorators),
            });
        }
    }, [shouldHighlight, editor, searchString, searchOptions]);

    // jump to item
    const currentSearchItem = useMemo(() => {
        const item = searchResults[currentSearchResultIndex];
        if (item?.cellId === cellId) {
            return item;
        }
        return null;
    }, [currentSearchResultIndex, cellId, searchResults]);

    useEffect(() => {
        if (currentSearchItem && editor) {
            // editor.focus();
            const selectionState: DraftJs.SelectionState = new DraftJs.SelectionState(
                {
                    anchorKey: currentSearchItem.blockKey,
                    anchorOffset: currentSearchItem.from,
                    focusKey: currentSearchItem.blockKey,
                    focusOffset: currentSearchItem.to,
                    hasFocus: false,
                    isBackward: false,
                }
            );
            editor.editorState = DraftJs.EditorState.forceSelection(
                editor.editorState,
                selectionState
            );
            setTimeout(() => {
                // Known issues: Pressing enter too fast
                // would cause the enter to be applied to the draft js
                // rich text editor, so setting a force blur after 50ms
                // to prevent the editor to be accidentally edited
                const element = window.getSelection().focusNode.parentElement;
                editor.draftJSEditor?.blur();

                setTimeout(() => {
                    // The DataDoc scrolls to the cell (sometimes its lazy loaded)
                    // however we also want to make sure we scroll to the element
                    // itself, so added a double scroll after 500ms to make sure
                    // it happens after the DataDoc scroll
                    scrollIntoView(element, {
                        scrollMode: 'if-needed',
                        duration: 0,
                    });
                    focusSearchBar();
                }, 50);
            }, 50);
        }
    }, [currentSearchResultIndex]);

    return null;
};

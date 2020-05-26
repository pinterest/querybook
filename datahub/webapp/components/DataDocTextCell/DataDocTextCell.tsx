import * as DraftJs from 'draft-js';
import { debounce, bind } from 'lodash-decorators';
import React from 'react';
import classNames from 'classnames';

import { DraftJsSearchHighlighter } from 'components/SearchAndReplace/DraftJsSearchHighlighter';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
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

        let handled = false;
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
                handled = true;
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
                    handled = true;
                }
            }
        } else if (event.keyCode === keyDeleteCode) {
            if (!editorState.getCurrentContent().hasText()) {
                this.props.onDeleteKeyPressed();
                handled = true;
            }
        }

        return handled;
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
                <DraftJsSearchHighlighter
                    editor={this.editorRef.current}
                    cellId={this.props.cellId}
                />
            </div>
        );
    }
}

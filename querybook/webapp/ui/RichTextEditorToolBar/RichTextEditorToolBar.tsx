import { EditorState, RichUtils } from 'draft-js';
import { bind } from 'lodash-decorators';
import React from 'react';

import { getSelectionRect } from 'lib/utils';
import { Popover } from 'ui/Popover/Popover';

import { LinkInput } from './LinkInput';
import { ToolBarButton } from './ToolBarButton';
import {
    blockButtonsConfig,
    entityButtonsConfig,
    styleButtonsConfig,
} from './ToolBarConfig';

import './RichTextEditorToolBar.scss';

export interface IRichTextEditorToolBarProps {
    editorState: EditorState;
    onChange: (editorState: EditorState) => any;
    focusEditor: () => any;
}

export interface IRichTextEditorToolBarState {
    showLinkInput: boolean;
}

export class RichTextEditorToolBar extends React.PureComponent<
    IRichTextEditorToolBarProps,
    IRichTextEditorToolBarState
> {
    public readonly state = {
        showLinkInput: false,
    };

    public selfRef = React.createRef<HTMLDivElement>();
    private lastSelectionRect: ClientRect = null;

    @bind
    public addUrlToEditor(url: string) {
        const { editorState, onChange } = this.props;
        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity(
            'LINK',
            'MUTABLE',
            { url }
        );
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const newEditorState = EditorState.push(
            editorState,
            contentStateWithEntity,
            'apply-entity'
        );

        onChange(
            RichUtils.toggleLink(
                newEditorState,
                newEditorState.getSelection(),
                entityKey
            )
        );
        this.focusEditor();
    }

    @bind
    public onShowLinkInput(mouseEvent: React.MouseEvent) {
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();

        this.showLinkInput();
    }

    @bind
    public showLinkInput() {
        this.setState({ showLinkInput: true });
    }

    @bind
    public hideLinkInput() {
        this.setState({ showLinkInput: false });
    }

    @bind
    public toggleStyle(inlineStyle, mouseEvent) {
        const { onChange, editorState } = this.props;

        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();

        onChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    }

    @bind
    public toggleBlock(blockType, mouseEvent) {
        const { onChange, editorState } = this.props;

        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();

        onChange(RichUtils.toggleBlockType(editorState, blockType));
    }

    public renderButtons() {
        let numberOfButtons = 0;
        const { editorState } = this.props;
        const currentStyle = editorState.getCurrentInlineStyle();

        const styleButtons = styleButtonsConfig.map((config, index) => (
            <ToolBarButton
                key={index}
                active={currentStyle.has(config.style)}
                icon={config.icon}
                tooltip={config.tooltip}
                onClick={this.toggleStyle.bind(null, config.style)}
            />
        ));
        numberOfButtons += styleButtons.length;

        const selection = editorState.getSelection();
        const blockType = editorState
            .getCurrentContent()
            .getBlockForKey(selection.getStartKey())
            .getType();

        const blockButtons = blockButtonsConfig.map((config, index) => (
            <ToolBarButton
                key={index + numberOfButtons}
                active={blockType === config.style}
                title={config.label}
                icon={config.icon}
                tooltip={config.tooltip}
                onClick={this.toggleBlock.bind(null, config.style)}
            />
        ));
        numberOfButtons += blockButtons.length;

        const entityButtons = entityButtonsConfig.map((config, index) => {
            const onClick =
                config.type === 'link' ? this.onShowLinkInput : null;
            return (
                <ToolBarButton
                    key={index + numberOfButtons}
                    active={false}
                    icon={config.icon}
                    tooltip={config.tooltip}
                    onClick={onClick}
                />
            );
        });
        numberOfButtons += blockButtons.length;

        return [].concat.apply(
            [],
            [
                styleButtons,
                [
                    <span
                        key={numberOfButtons + 1}
                        className="toolbar-separator"
                    />,
                ],
                blockButtons,
                [
                    <span
                        key={numberOfButtons + 2}
                        className="toolbar-separator"
                    />,
                ],
                entityButtons,
            ]
        );
    }

    public render() {
        const { showLinkInput } = this.state;

        let contentDOM = null;
        const selectionRect = getSelectionRect() ?? this.lastSelectionRect;

        if (selectionRect != null) {
            if (showLinkInput) {
                this.lastSelectionRect = selectionRect;
                const linkInput = (
                    <Popover
                        anchorBox={selectionRect}
                        layout={['bottom']}
                        onHide={this.hideLinkInput}
                    >
                        <LinkInput
                            onDismiss={this.hideLinkInput}
                            onSubmit={this.addUrlToEditor}
                        />
                    </Popover>
                );
                contentDOM = linkInput;
            } else {
                contentDOM = this.renderButtons();
            }
        }

        return (
            <div className={'RichTextEditorToolBar '} ref={this.selfRef}>
                {contentDOM}
            </div>
        );
    }

    public focusEditor() {
        // Make sure we focus later to avoid onChange race condition
        setTimeout(() => {
            this.props.focusEditor();
        }, 50);
    }
}

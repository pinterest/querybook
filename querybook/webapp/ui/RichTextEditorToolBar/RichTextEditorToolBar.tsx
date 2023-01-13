import { EditorState, RichUtils } from 'draft-js';
import React, {
    useCallback,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import { getSelectionRect } from 'lib/utils';
import { stopPropagationAndDefault } from 'lib/utils/noop';
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
export interface IRichTextEditorToolBarHandles {
    getContainer: () => HTMLDivElement;
    showLinkInput: () => void;
}

export const RichTextEditorToolBar = React.forwardRef<
    IRichTextEditorToolBarHandles,
    IRichTextEditorToolBarProps
>(({ editorState, onChange, focusEditor }, ref) => {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const hideLinkInput = useCallback(() => setShowLinkInput(false), []);

    const selfRef = useRef<HTMLDivElement>();
    const lastSelectionRectRef = useRef<ClientRect>();

    const focusEditorAfterWait = useCallback(() => {
        setTimeout(() => {
            focusEditor();
        }, 50);
    }, [focusEditor]);

    const addUrlToEditor = useCallback(
        (url: string) => {
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
            focusEditorAfterWait();
        },
        [editorState, onChange, focusEditorAfterWait]
    );

    const handleShowLinkInput = useCallback((mouseEvent: React.MouseEvent) => {
        stopPropagationAndDefault(mouseEvent);
        setShowLinkInput(true);
    }, []);

    const toggleStyle = useCallback(
        (inlineStyle: string, mouseEvent: React.MouseEvent) => {
            stopPropagationAndDefault(mouseEvent);
            onChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
        },
        [onChange, editorState]
    );

    const toggleBlock = useCallback(
        (blockType, mouseEvent: React.MouseEvent) => {
            stopPropagationAndDefault(mouseEvent);
            onChange(RichUtils.toggleBlockType(editorState, blockType));
        },
        [onChange, editorState]
    );

    useImperativeHandle(
        ref,
        () => ({
            getContainer: () => selfRef.current,
            showLinkInput: () => setShowLinkInput(true),
        }),
        []
    );

    const renderButtons = () => {
        let numberOfButtons = 0;
        const currentStyle = editorState.getCurrentInlineStyle();
        const styleButtons = styleButtonsConfig.map((config, index) => (
            <ToolBarButton
                key={index}
                active={currentStyle.has(config.style)}
                icon={config.icon}
                tooltip={config.tooltip}
                onClick={toggleStyle.bind(null, config.style)}
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
                onClick={toggleBlock.bind(null, config.style)}
            />
        ));
        numberOfButtons += blockButtons.length;

        const entityButtons = entityButtonsConfig.map((config, index) => {
            const onClick = config.type === 'link' ? handleShowLinkInput : null;
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
    };

    let contentDOM = null;
    if (showLinkInput) {
        const selectionRect =
            getSelectionRect() ?? lastSelectionRectRef.current;
        if (selectionRect != null) {
            lastSelectionRectRef.current = selectionRect;
            const linkInput = (
                <Popover
                    anchorBox={selectionRect}
                    layout={['bottom']}
                    onHide={hideLinkInput}
                >
                    <LinkInput
                        onDismiss={hideLinkInput}
                        onSubmit={addUrlToEditor}
                    />
                </Popover>
            );
            contentDOM = linkInput;
        }
    } else {
        contentDOM = renderButtons();
    }

    return (
        <div className={'RichTextEditorToolBar '} ref={selfRef}>
            {contentDOM}
        </div>
    );
});

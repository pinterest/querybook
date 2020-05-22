import * as React from 'react';

import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';
import { Popover } from 'ui/Popover/Popover';

export const InfoMenuButton: React.FunctionComponent = () => {
    const [showPanel, setShowPanel] = React.useState(false);
    const [helpModal, setHelpModal] = React.useState<
        'log' | 'tip' | 'shortcut' | 'faq'
    >(null);
    const buttonRef = React.useRef<HTMLAnchorElement>();

    const getModalDOM = () => {
        switch (helpModal) {
            case 'log':
                return (
                    <Modal
                        onHide={() => setHelpModal(null)}
                        title="Logs"
                        className="with-padding"
                    >
                        <div className="ChangeLog">
                            <div
                                className="content ChangeLog-content"
                                dangerouslySetInnerHTML={{
                                    __html: contentLogContent,
                                }}
                            />
                            <div className="ChangeLog-control">
                                <Button onClick={onDismissChangeLog}>
                                    Dismiss
                                </Button>
                            </div>
                        </div>
                    </Modal>
                );
            case 'tip':
                return (
                    <Modal
                        onHide={() => setHelpModal(null)}
                        title="Tips"
                        className="with-padding"
                    >
                        Tips
                    </Modal>
                );
            case 'shortcut':
                return (
                    <Modal
                        onHide={() => setHelpModal(null)}
                        title="Shortcuts"
                        className="with-padding"
                    >
                        shortcuts
                    </Modal>
                );
            case 'faq':
                return (
                    <Modal
                        onHide={() => setHelpModal(null)}
                        title="FAQs"
                        className="with-padding"
                    >
                        FAQs
                    </Modal>
                );
            default:
                return null;
        }
    };

    const getPanelDOM = () => {
        const panelContent = (
            <div className="popover-menu">
                <div
                    className="popover-item-clickable"
                    onClick={() => setHelpModal('tip')}
                >
                    Tips
                </div>
                <hr className="popover-divider" />
                <div
                    className="popover-item-clickable"
                    onClick={() => setHelpModal('shortcut')}
                >
                    Shortcuts
                </div>
                <hr className="popover-divider" />
                <div
                    className="popover-item-clickable"
                    onClick={() => setHelpModal('faq')}
                >
                    FAQs
                </div>
            </div>
        );
        return (
            <Popover
                anchor={buttonRef.current}
                layout={['right', 'bottom']}
                onHide={() => setShowPanel(false)}
                resizeOnChange
            >
                {panelContent}
            </Popover>
        );
    };
    return (
        <div className="InfoMenuButton">
            <IconButton
                className="InfoMenuButton-button"
                onClick={() => setShowPanel(true)}
                ref={buttonRef}
                icon={'info'}
                tooltip={'Logs, Tips, Shortcuts, & FAQs'}
                tooltipPos="right"
            />
            {showPanel ? getPanelDOM() : null}
            {helpModal ? getModalDOM() : null}
        </div>
    );
};

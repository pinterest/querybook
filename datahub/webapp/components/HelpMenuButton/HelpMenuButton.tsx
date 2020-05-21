import * as React from 'react';
import { IconButton } from 'ui/Button/IconButton';
import { Popover } from 'ui/Popover/Popover';
import { Modal } from 'ui/Modal/Modal';

interface IProps {}

export const HelpMenuButton: React.FunctionComponent<IProps> = () => {
    const [showPanel, setShowPanel] = React.useState(false);
    const [helpModal, setHelpModal] = React.useState(null);
    const buttonRef = React.useRef<HTMLAnchorElement>();

    const getModalDOM = () => {
        switch (helpModal) {
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
        <div className="HelpMenuButton">
            <IconButton
                className="HelpMenuButton-button"
                onClick={() => setShowPanel(true)}
                ref={buttonRef}
                icon={'help-circle'}
                tooltip={'Tips, Shortcuts, & FAQs'}
                tooltipPos="right"
            />
            {showPanel ? getPanelDOM() : null}
            {helpModal ? getModalDOM() : null}
        </div>
    );
};

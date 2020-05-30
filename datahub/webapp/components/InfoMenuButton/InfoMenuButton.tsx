import * as React from 'react';

import { navigateWithinEnv } from 'lib/utils/query-string';

import { IconButton } from 'ui/Button/IconButton';
import { Popover } from 'ui/Popover/Popover';
import { MenuDivider, Menu, MenuItem } from 'ui/Menu/Menu';

export const InfoMenuButton: React.FunctionComponent = () => {
    const [showPanel, setShowPanel] = React.useState(false);

    const buttonRef = React.useRef<HTMLAnchorElement>();

    const getPanelDOM = () => {
        const panelContent = (
            <Menu>
                <MenuItem
                    onClick={() =>
                        navigateWithinEnv('/changelog/', {
                            isModal: true,
                        })
                    }
                >
                    Change Logs
                </MenuItem>
                <MenuDivider />
                <MenuItem
                    onClick={() =>
                        navigateWithinEnv('/info/tip/', {
                            isModal: true,
                        })
                    }
                >
                    Tips
                </MenuItem>
                <MenuDivider />
                <MenuItem
                    onClick={() =>
                        navigateWithinEnv('/info/shortcut/', {
                            isModal: true,
                        })
                    }
                >
                    Shortcuts
                </MenuItem>
                <MenuDivider />
                <MenuItem
                    onClick={() =>
                        navigateWithinEnv('/info/faq/', {
                            isModal: true,
                        })
                    }
                >
                    FAQs
                </MenuItem>
            </Menu>
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
                icon={'help-circle'}
                tooltip={'Logs, Tips, Shortcuts, & FAQs'}
                tooltipPos="right"
            />
            {showPanel ? getPanelDOM() : null}
        </div>
    );
};

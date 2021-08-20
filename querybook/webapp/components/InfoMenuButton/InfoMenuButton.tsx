import * as React from 'react';

import localStore from 'lib/local-store';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { ChangeLogValue, CHANGE_LOG_KEY } from 'lib/local-store/const';

import { IconButton } from 'ui/Button/IconButton';
import { Popover } from 'ui/Popover/Popover';
import {
    MenuDivider,
    Menu,
    MenuItem,
    MenuItemPing,
    MenuInfoItem,
} from 'ui/Menu/Menu';
import { QuerybookVersion } from './QuerybookVersion';
import { ChangeLogResource } from 'resource/utils/changelog';

export const InfoMenuButton: React.FunctionComponent = () => {
    const [showPanel, setShowPanel] = React.useState(false);
    const [notification, setNotification] = React.useState(false);

    const buttonRef = React.useRef<HTMLAnchorElement>();

    React.useEffect(() => {
        localStore
            .get<ChangeLogValue>(CHANGE_LOG_KEY)
            .then((lastViewedDate) => {
                ChangeLogResource.getAll(lastViewedDate).then(({ data }) => {
                    if (data) {
                        setNotification(true);
                    }
                });
            });
    }, []);

    const getPanelDOM = () => {
        const panelContent = (
            <Menu>
                <MenuInfoItem>
                    Querybook v<QuerybookVersion />
                </MenuInfoItem>
                <MenuDivider />
                <MenuItem
                    onClick={() => {
                        navigateWithinEnv('/changelog/', {
                            isModal: true,
                        });
                        setNotification(false);
                    }}
                >
                    Change Logs
                    {notification ? <MenuItemPing /> : null}
                </MenuItem>
                <MenuItem
                    onClick={() =>
                        navigateWithinEnv('/info/shortcut/', {
                            isModal: true,
                        })
                    }
                >
                    Shortcuts
                </MenuItem>
                <MenuItem
                    onClick={() =>
                        navigateWithinEnv('/info/faq/', {
                            isModal: true,
                        })
                    }
                >
                    FAQs
                </MenuItem>
                <MenuItem
                    onClick={() =>
                        navigateWithinEnv('/info/tour/', {
                            isModal: true,
                        })
                    }
                >
                    Tutorials
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
                ping={notification}
                title="Info"
            />
            {showPanel ? getPanelDOM() : null}
        </div>
    );
};

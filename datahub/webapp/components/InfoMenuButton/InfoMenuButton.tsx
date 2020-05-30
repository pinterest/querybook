import * as React from 'react';

import ds from 'lib/datasource';
import localStore from 'lib/local-store';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { ChangeLogValue, CHANGE_LOG_KEY } from 'lib/local-store/const';

import { IconButton } from 'ui/Button/IconButton';
import { Popover } from 'ui/Popover/Popover';
import { MenuDivider, Menu, MenuItem } from 'ui/Menu/Menu';

export const InfoMenuButton: React.FunctionComponent = () => {
    const [showPanel, setShowPanel] = React.useState(false);
    const [notification, setNotification] = React.useState(false);

    const buttonRef = React.useRef<HTMLAnchorElement>();

    React.useEffect(() => {
        localStore
            .get<ChangeLogValue>(CHANGE_LOG_KEY)
            .then((lastViewedDate) => {
                ds.fetch(`/utils/change_logs/`, {
                    last_viewed_date: lastViewedDate,
                }).then(({ data }) => {
                    if (data) {
                        setNotification(true);
                    }
                });
            });
    }, []);

    const getPanelDOM = () => {
        const panelContent = (
            <Menu>
                <MenuItem
                    onClick={() => {
                        navigateWithinEnv('/changelog/', {
                            isModal: true,
                        });
                        setNotification(false);
                    }}
                >
                    Change Logs
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
                <MenuDivider />
                <MenuItem
                    onClick={() =>
                        navigateWithinEnv('/info/tour/', {
                            isModal: true,
                        })
                    }
                >
                    Tours
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
            />
            {showPanel ? getPanelDOM() : null}
        </div>
    );
};

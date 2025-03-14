import * as React from 'react';
import { matchPath } from 'react-router-dom';

import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import localStore from 'lib/local-store';
import { CHANGE_LOG_KEY, ChangeLogValue } from 'lib/local-store/const';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { ChangeLogResource } from 'resource/utils/changelog';
import { IconButton } from 'ui/Button/IconButton';
import { Menu, MenuDivider, MenuInfoItem, MenuItem } from 'ui/Menu/Menu';
import { Popover } from 'ui/Popover/Popover';

import { QuerybookVersion } from './QuerybookVersion';

export const InfoMenuButton: React.FunctionComponent = () => {
    const [showPanel, setShowPanel] = React.useState(false);

    const buttonRef = React.useRef<HTMLAnchorElement>();

    React.useEffect(() => {
        localStore
            .get<ChangeLogValue>(CHANGE_LOG_KEY)
            .then((lastViewedDate) => {
                ChangeLogResource.getAll(lastViewedDate).then(({ data }) => {
                    if (data) {
                        // Automatically open the changelog modal if there's a new change
                        // and the current page is not the changelog page
                        const match = matchPath(location.pathname, {
                            path: '/:env/changelog/:date?',
                            exact: true,
                            strict: false,
                        });
                        if (!match) {
                            navigateWithinEnv('/changelog/', {
                                isModal: true,
                            });
                        }
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
                    }}
                >
                    Change Logs
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
                        navigateWithinEnv('/info/templating/', {
                            isModal: true,
                        })
                    }
                >
                    Template Guide
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
                onClick={() => {
                    trackClick({
                        component: ComponentType.LEFT_SIDEBAR,
                        element: ElementType.HELP_BUTTON,
                    });
                    setShowPanel(true);
                }}
                ref={buttonRef}
                icon={'HelpCircle'}
                tooltip={'Logs, Tips, Shortcuts, & FAQs'}
                tooltipPos="right"
                title="Help"
            />
            {showPanel ? getPanelDOM() : null}
        </div>
    );
};

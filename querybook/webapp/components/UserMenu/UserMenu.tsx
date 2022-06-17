import React, { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TokenCreation } from 'components/Token/TokenCreation';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { TooltipDirection } from 'const/tooltip';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { Dispatch, IStoreState } from 'redux/store/types';
import * as UserActions from 'redux/user/action';
import { UserResource } from 'resource/user';
import { IconButton } from 'ui/Button/IconButton';
import { Link } from 'ui/Link/Link';
import { Menu, MenuDivider, MenuInfoItem, MenuItem } from 'ui/Menu/Menu';
import { Modal } from 'ui/Modal/Modal';
import { Popover, PopoverLayout } from 'ui/Popover/Popover';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

import './UserMenu.scss';

interface IUserMenuProps {
    tooltipPos?: TooltipDirection;
    popoverLayout?: PopoverLayout;
}

export const UserMenu: React.FC<IUserMenuProps> = ({
    tooltipPos = 'right',
    popoverLayout = ['right', 'bottom'] as PopoverLayout,
}) => {
    const [showUserMenuPopover, setShowUserMenuPopover] = useState(false);
    const toggleUserMenuPopover = useCallback(
        () => setShowUserMenuPopover((val) => !val),
        []
    );

    const [showTokenModal, setShowTokenModal] = useState(false);
    const toggleShowTokenModal = useCallback(
        () => setShowTokenModal((val) => !val),
        []
    );

    const selfRef = useRef<HTMLSpanElement>(null);
    const goToUserSettingsMenu = useCallback(() => {
        navigateWithinEnv('/user_settings/', {
            isModal: true,
        });
    }, []);

    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);
    const theme = useSelector(
        (state: IStoreState) => state.user.computedSettings['theme']
    );
    const dispatch: Dispatch = useDispatch();
    const logout = useCallback(
        () => UserResource.logout().then(() => window.location.reload()),
        []
    );
    const setTheme = useCallback(
        (newTheme: 'dark' | 'default') =>
            dispatch(UserActions.setUserSettings('theme', newTheme)),
        []
    );

    const getUserDropdownDOM = () => {
        const showThemeToggle = theme === 'dark' || theme === 'default';
        const themeToggle = showThemeToggle ? (
            <MenuInfoItem className="horizontal-space-between">
                <span className="mr12">Dark Theme</span>
                <ToggleSwitch
                    checked={theme === 'dark'}
                    onChange={(val) => setTheme(val ? 'dark' : 'default')}
                />
            </MenuInfoItem>
        ) : null;
        return (
            <Menu>
                <MenuInfoItem>
                    <UserBadge uid={userInfo.uid} cardStyle />
                </MenuInfoItem>
                <MenuDivider />
                {themeToggle}
                <MenuItem onClick={goToUserSettingsMenu}>Settings</MenuItem>
                <MenuDivider />
                <MenuItem onClick={toggleShowTokenModal}>
                    API Access Token
                </MenuItem>
                {userInfo.isAdmin && (
                    <MenuItem>
                        <Link className="flex1" to="/admin">
                            Admin Tools
                        </Link>
                    </MenuItem>
                )}
                <MenuDivider />
                <MenuItem onClick={logout}>Log out</MenuItem>
            </Menu>
        );
    };

    const tokenCreationModalDOM = showTokenModal ? (
        <Modal
            onHide={toggleShowTokenModal}
            className="message-size"
            title="Token Creation"
        >
            <TokenCreation uid={userInfo.uid} />
        </Modal>
    ) : null;

    const userSettingsPopover = showUserMenuPopover && (
        <Popover
            anchor={selfRef.current}
            layout={popoverLayout}
            onHide={toggleUserMenuPopover}
            resizeOnChange
        >
            {getUserDropdownDOM()}
        </Popover>
    );

    return (
        <>
            <span
                className="UserMenu flex-column"
                ref={selfRef}
                onClick={toggleUserMenuPopover}
                aria-label={'User Settings'}
                data-balloon-pos={tooltipPos}
            >
                <IconButton icon="Settings" title="Settings" />
            </span>
            {tokenCreationModalDOM}
            {userSettingsPopover}
        </>
    );
};

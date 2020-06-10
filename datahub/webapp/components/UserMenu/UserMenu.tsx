import React, { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IStoreState, Dispatch } from 'redux/store/types';
import * as UserActions from 'redux/user/action';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { TooltipDirection } from 'const/tooltip';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { TokenCreation } from 'components/Token/TokenCreation';
import { UserAvatar } from 'components/UserBadge/UserAvatar';

import { MenuInfoItem, Menu, MenuDivider, MenuItem } from 'ui/Menu/Menu';
import { Modal } from 'ui/Modal/Modal';
import { Popover, PopoverLayout } from 'ui/Popover/Popover';

import './UserMenu.scss';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

interface IProps {
    tooltipPos?: TooltipDirection;
    popoverLayout?: PopoverLayout;
}

interface IState {
    showUserMenuPopover: boolean;
    showTokenCreationModal: boolean;
}

export const UserMenu: React.FC<IProps> = ({
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

    const uid = useSelector((state: IStoreState) => state.user.myUserInfo.uid);
    const theme = useSelector(
        (state: IStoreState) => state.user.computedSettings['theme']
    );
    const dispatch: Dispatch = useDispatch();
    const logout = useCallback(
        () =>
            dispatch(UserActions.logoutUser()).then(() =>
                window.location.reload()
            ),
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
                <span className="mr8">Dark Theme</span>
                <ToggleSwitch
                    checked={theme === 'dark'}
                    onChange={(val) => setTheme(val ? 'dark' : 'default')}
                />
            </MenuInfoItem>
        ) : null;
        return (
            <Menu>
                <MenuInfoItem>
                    <UserBadge uid={uid} />
                </MenuInfoItem>
                <MenuDivider />
                <MenuItem onClick={goToUserSettingsMenu}>Settings</MenuItem>
                <MenuDivider />
                {themeToggle}
                <MenuDivider />
                <MenuItem onClick={toggleShowTokenModal}>
                    API Access Token
                </MenuItem>
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
            <TokenCreation uid={uid} />
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
                className="UserMenu"
                ref={selfRef}
                onClick={toggleUserMenuPopover}
                aria-label={'User Settings'}
                data-balloon-pos={tooltipPos}
            >
                <UserAvatar uid={uid} />
            </span>
            {tokenCreationModalDOM}
            {userSettingsPopover}
        </>
    );
};

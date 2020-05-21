import { bind } from 'lodash-decorators';
import React from 'react';
import { connect } from 'react-redux';

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

interface IOwnProps {
    tooltipPos?: TooltipDirection;
    popoverLayout?: PopoverLayout;
}
type IProps = IOwnProps &
    ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

interface IState {
    showUserMenuPopover: boolean;
    showTokenCreationModal: boolean;
}

class UserMenuComponent extends React.PureComponent<IProps, IState> {
    public readonly state = {
        showUserMenuPopover: false,
        showTokenCreationModal: false,
    };

    private selfRef = React.createRef<HTMLSpanElement>();

    @bind
    public toggleUserMenuPopover() {
        this.setState(({ showUserMenuPopover }) => ({
            showUserMenuPopover: !showUserMenuPopover,
        }));
    }

    @bind
    public goToUserSettingsMenu() {
        navigateWithinEnv('/user_settings/', {
            isModal: true,
        });
    }

    @bind
    public toggleTokenCreationModal() {
        this.setState(({ showTokenCreationModal }) => ({
            showTokenCreationModal: !showTokenCreationModal,
        }));
    }

    @bind
    public logout() {
        this.props.logout().then(() => window.location.reload());
    }

    public getUserDropdownDOM() {
        return (
            <Menu>
                <MenuInfoItem>
                    <UserBadge uid={this.props.uid} />
                </MenuInfoItem>
                {/* <MenuInfoItem>
                    <div className="user-group-wrapper">{[]}</div>
                </MenuInfoItem> */}
                <MenuDivider />
                <MenuItem onClick={this.goToUserSettingsMenu}>
                    Settings
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={this.toggleTokenCreationModal}>
                    API Access Token
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={this.logout}>Log out</MenuItem>
            </Menu>
        );
    }

    public render() {
        const {
            tooltipPos = 'right',
            popoverLayout = ['right', 'bottom'] as PopoverLayout,
            uid,
        } = this.props;
        const { showUserMenuPopover, showTokenCreationModal } = this.state;
        const tokenCreationModalDOM = showTokenCreationModal ? (
            <Modal
                onHide={this.toggleTokenCreationModal}
                className="message-size"
                title="Token Creation"
            >
                <TokenCreation uid={this.props.uid} />
            </Modal>
        ) : null;

        const userSettingsPopover = showUserMenuPopover && (
            <Popover
                anchor={this.selfRef.current}
                layout={popoverLayout}
                onHide={this.toggleUserMenuPopover}
                resizeOnChange
            >
                {this.getUserDropdownDOM()}
            </Popover>
        );

        return (
            <>
                <span
                    className="UserMenu"
                    ref={this.selfRef}
                    onClick={this.toggleUserMenuPopover}
                    aria-label={'User Settings'}
                    data-balloon-pos={tooltipPos}
                >
                    <UserAvatar uid={uid} />
                </span>
                {tokenCreationModalDOM}
                {userSettingsPopover}
            </>
        );
    }
}

function mapStateToProps(state: IStoreState, ownProps: {}) {
    return {
        uid: state.user.myUserInfo.uid,
    };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: {}) {
    return {
        logout: () => dispatch(UserActions.logoutUser()),
    };
}

export const UserMenu = connect(
    mapStateToProps,
    mapDispatchToProps
)(UserMenuComponent);

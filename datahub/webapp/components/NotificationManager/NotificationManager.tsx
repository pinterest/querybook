import React from 'react';
import { connect } from 'react-redux';
import { Transition, animated, config } from 'react-spring/renderprops.cjs';
import styled from 'styled-components';

import * as datahubUIActions from 'redux/dataHubUI/action';
import { INotificationInfo } from 'redux/dataHubUI/types';
import { IStoreState, Dispatch } from 'redux/store/types';
import { Overlay } from 'ui/Overlay/Overlay';

import { Notification } from './Notification';

export const DEFAULT_NOTIFICATION_TIMEOUT = 3000;
const spring = { ...config.default, precision: 0.1 };

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;
type IProps = StateProps & DispatchProps;

const NotificationContainer = styled.div`
    bottom: 10px;
    right: 10px;

    display: flex;
    flex-direction: column;
    z-index: 300;
    position: fixed;
`;

const notificationRoot = document.getElementById('notification-root');

class NotificationManagerComponent extends React.Component<IProps> {
    public cancelMap = new WeakMap();
    public cancel = (item: INotificationInfo) => {
        if (this.cancelMap.has(item)) {
            this.cancelMap.get(item)();
        }
    };

    public enter = (item: INotificationInfo) => async (next, cancel) => {
        this.cancelMap.set(item, cancel);
        await next({ opacity: 1, height: 'auto' });
        await next(
            {
                life: 0,
                config: { ...spring, duration: item.timeout },
            },
            true
        );
    };

    public leave = (item: INotificationInfo) => async (next, cancel) => {
        this.cancelMap.set(item, cancel);
        await next({ opacity: 0 });
        await next({ height: 0 }, true);
    };

    public remove = (item: INotificationInfo) => {
        this.props.popNotification(item.id);
    };

    // public componentDidUpdate(prevProps) {
    //     if (prevProps.notifications !== this.props.notifications) {
    //         for (const notification of prevProps.notifications) {
    //             if (
    //                 !this.props.notifications.includes(notification) &&
    //                 this.cancelMap.has(notification)
    //             ) {
    //                 this.cancel(notification);
    //                 this.cancel(notification);
    //             }
    //         }
    //     }
    // }

    public render() {
        const { notifications } = this.props;

        return (
            <Overlay customOverlayRoot={notificationRoot}>
                <NotificationContainer>
                    <Transition
                        items={notifications}
                        keys={(item: INotificationInfo) => item.id}
                        from={{ opacity: 0, height: 0, life: 1 }}
                        enter={this.enter}
                        leave={this.leave}
                        onRest={this.remove}
                        config={spring}
                    >
                        {(item: INotificationInfo) => ({ life, ...props }) => (
                            <animated.div
                                style={props}
                                className="NotificationWrapper"
                            >
                                <Notification
                                    content={item.content}
                                    onHide={() => this.cancel(item)}
                                    life={life}
                                />
                            </animated.div>
                        )}
                    </Transition>
                </NotificationContainer>
            </Overlay>
        );
    }
}

function mapStateToProps(state: IStoreState) {
    return {
        notifications: state.dataHubUI.notifications,
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        popNotification: (id: string) =>
            dispatch(datahubUIActions.popNotification(id)),
    };
}

export const NotificationManager = connect(
    mapStateToProps,
    mapDispatchToProps
)(NotificationManagerComponent);

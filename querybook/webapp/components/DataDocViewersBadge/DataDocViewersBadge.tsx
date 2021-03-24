import { bind } from 'lodash-decorators';
import { connect } from 'react-redux';
import React from 'react';

import { IStoreState, Dispatch } from 'redux/store/types';
import * as dataDocActions from 'redux/dataDoc/action';
import * as dataDocSelectors from 'redux/dataDoc/selector';

import { DataDocViewersList } from 'components/DataDocViewersList/DataDocViewersList';
import './DataDocViewersBadge.scss';
import { Popover } from 'ui/Popover/Popover';
import { Button } from 'ui/Button/Button';
import { DataDocPermission } from 'lib/data-doc/datadoc-permission';
import { UserAvatarList } from 'components/UserBadge/UserAvatarList';

interface IOwnProps {
    numberBadges?: number;
    docId: number;
}
type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

type IProps = IOwnProps & StateProps & DispatchProps;
interface IState {
    showViewsList: boolean;
}

class DataDocViewersBadgeComponent extends React.PureComponent<IProps, IState> {
    public static defaultProps = {
        numberBadges: 4,
    };

    public readonly state = {
        showViewsList: false,
    };
    public selfRef = React.createRef<HTMLDivElement>();

    @bind
    public setShowViewsList(showViewsList: boolean) {
        this.setState({
            showViewsList,
        });
    }

    @bind
    public getBadgeContentDOM() {
        const {
            viewerInfos,
            numberBadges,
            userInfoById,
            dataDoc,
            accessRequestsByUid,
            readonly,
        } = this.props;
        const { showViewsList } = this.state;
        const extraViewersCount = viewerInfos.length - numberBadges;

        const viewersDOM = (
            <UserAvatarList
                users={viewerInfos.slice(0, numberBadges).map((viewerInfo) => ({
                    uid: viewerInfo.uid,
                    tooltip:
                        viewerInfo.uid in userInfoById
                            ? userInfoById[viewerInfo.uid].username
                            : null,
                    isOnline: viewerInfo.online,
                }))}
                extraCount={extraViewersCount}
            />
        );

        const accessRequestsByUidLength = Object.keys(accessRequestsByUid)
            .length;
        const shareButtonDOM = (
            <Button
                className="viewers-badge-share-button"
                icon={dataDoc.public ? 'users' : 'lock'}
                title="Share"
                color="light"
                pushable
                ping={
                    !readonly && accessRequestsByUidLength > 0
                        ? accessRequestsByUidLength.toString()
                        : null
                }
            />
        );

        return (
            <div
                className="viewers-badge-viewers"
                onClick={() => this.setShowViewsList(!showViewsList)}
            >
                {viewersDOM}
                {shareButtonDOM}
            </div>
        );
    }

    public render() {
        const {
            viewerInfos,
            dataDoc,
            editorsByUid,
            readonly,
            ownerId,
            accessRequestsByUid,

            addDataDocEditor,
            changeDataDocPublic,
            updateDataDocEditors,
            deleteDataDocEditor,
            updateDataDocOwner,
            rejectDataDocAccessRequest,
        } = this.props;

        const { showViewsList } = this.state;

        if (!(viewerInfos && viewerInfos.length)) {
            return null;
        }

        const viewsListDOM = showViewsList && (
            <Popover
                anchor={this.selfRef.current}
                onHide={this.setShowViewsList.bind(this, false)}
                layout={['bottom', 'right']}
                resizeOnChange
            >
                <DataDocViewersList
                    readonly={readonly}
                    viewerInfos={viewerInfos}
                    accessRequestsByUid={accessRequestsByUid}
                    isOwner={dataDoc.owner_uid === ownerId}
                    editorsByUid={editorsByUid}
                    dataDoc={dataDoc}
                    addDataDocEditor={addDataDocEditor}
                    changeDataDocPublic={changeDataDocPublic}
                    updateDataDocEditors={updateDataDocEditors}
                    deleteDataDocEditor={deleteDataDocEditor}
                    updateDataDocOwner={updateDataDocOwner}
                    rejectDataDocAccessRequest={rejectDataDocAccessRequest}
                />
            </Popover>
        );

        return (
            <div className="DataDocViewersBadge" ref={this.selfRef}>
                {this.getBadgeContentDOM()}
                {viewsListDOM}
            </div>
        );
    }
}

function mapStateToProps(state: IStoreState, ownProps: IOwnProps) {
    const viewerInfos = dataDocSelectors.dataDocViewerInfosSelector(
        state,
        ownProps.docId
    );
    return {
        viewerInfos,
        editorsByUid: dataDocSelectors.dataDocEditorByUidSelector(
            state,
            ownProps.docId
        ),
        accessRequestsByUid: dataDocSelectors.currentDataDocAccessRequestsByUidSelector(
            state,
            ownProps.docId
        ),
        dataDoc: dataDocSelectors.dataDocSelector(state, ownProps.docId),
        userInfoById: state.user.userInfoById,
        readonly: !dataDocSelectors.canCurrentUserEditSelector(
            state,
            ownProps.docId
        ),
        ownerId: state.user.myUserInfo.uid,
    };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: IOwnProps) {
    return {
        changeDataDocPublic: (docId: number, docPublic: boolean) =>
            dispatch(
                dataDocActions.updateDataDocField(docId, 'public', docPublic)
            ),

        updateDataDocEditors: (uid: number, read: boolean, write: boolean) =>
            dispatch(
                dataDocActions.updateDataDocEditors(
                    ownProps.docId,
                    uid,
                    read,
                    write
                )
            ),

        deleteDataDocEditor: (uid: number) =>
            dispatch(dataDocActions.deleteDataDocEditor(ownProps.docId, uid)),

        addDataDocEditor: (uid: number, permission: DataDocPermission) => {
            dispatch(
                dataDocActions.addDataDocEditors(
                    ownProps.docId,
                    uid,
                    permission
                )
            );
        },

        updateDataDocOwner: (nextOwnerId: number) => {
            dispatch(
                dataDocActions.updateDataDocOwner(ownProps.docId, nextOwnerId)
            );
        },

        rejectDataDocAccessRequest: (uid: number) => {
            dispatch(
                dataDocActions.rejectDataDocAccessRequest(ownProps.docId, uid)
            );
        },
    };
}

export const DataDocViewersBadge = connect(
    mapStateToProps,
    mapDispatchToProps
)(DataDocViewersBadgeComponent);

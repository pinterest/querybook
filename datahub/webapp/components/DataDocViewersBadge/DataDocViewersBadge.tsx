import classNames from 'classnames';
import { bind } from 'lodash-decorators';
import { connect } from 'react-redux';
import React from 'react';

import { IStoreState, Dispatch } from 'redux/store/types';
import * as dataDocActions from 'redux/dataDoc/action';
import * as dataDocSelectors from 'redux/dataDoc/selector';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { DataDocViewersList } from 'components/DataDocViewersList/DataDocViewersList';
import './DataDocViewersBadge.scss';
import { Popover } from 'ui/Popover/Popover';
import { Button } from 'ui/Button/Button';

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

class DataDocViewersBadgeComponent extends React.Component<IProps, IState> {
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
        const { viewerInfos, numberBadges, userInfoById, dataDoc } = this.props;
        const { showViewsList } = this.state;

        const viewersDOM = viewerInfos
            .slice(0, numberBadges)
            .map((viewerInfo) => (
                <div
                    className="viewers-badge-viewer-wrapper"
                    key={viewerInfo.uid}
                >
                    <div
                        className={classNames({
                            'viewers-badge-viewer': true,
                            // offline: !viewerInfo.online,
                        })}
                        aria-label={
                            viewerInfo.uid in userInfoById
                                ? userInfoById[viewerInfo.uid].username
                                : null
                        }
                        data-balloon-pos={'down'}
                    >
                        <UserAvatar
                            isOnline={viewerInfo.online}
                            uid={viewerInfo.uid}
                        />
                    </div>
                </div>
            ));

        const extraViewersCount = viewerInfos.length - numberBadges;

        const extraViewersDOM = extraViewersCount > 0 && (
            <div
                className="viewers-badge-viewer-wrapper viewers-badge-viewer-count"
                key={'count'}
                aria-label={`${extraViewersCount} Others`}
                data-balloon-pos={'down'}
            >
                <div className="viewers-badge-viewer">
                    {extraViewersCount < 100 ? extraViewersCount : '*'}
                </div>
            </div>
        );

        const shareButtonDOM = (
            <Button
                className="viewers-badge-share-button"
                icon={dataDoc.public ? 'users' : 'lock'}
                title="Share"
                pushable
            />
        );

        return (
            <div
                className="viewers-badge-viewers"
                onClick={() => this.setShowViewsList(!showViewsList)}
            >
                {viewersDOM}
                {extraViewersDOM}
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

            addDataDocEditor,
            changeDataDocPublic,
            updateDataDocEditors,
            deleteDataDocEditor,
            updateDataDocOwner,
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
                    isOwner={dataDoc.owner_uid == ownerId}
                    editorsByUid={editorsByUid}
                    dataDoc={dataDoc}
                    addDataDocEditor={addDataDocEditor}
                    changeDataDocPublic={changeDataDocPublic}
                    updateDataDocEditors={updateDataDocEditors}
                    deleteDataDocEditor={deleteDataDocEditor}
                    updateDataDocOwner={updateDataDocOwner}
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
        ownProps
    );
    return {
        viewerInfos,
        editorsByUid: dataDocSelectors.dataDocEditorByUidSelector(
            state,
            ownProps
        ),
        dataDoc: dataDocSelectors.dataDocSelector(state, ownProps),
        userInfoById: state.user.userInfoById,
        readonly: !dataDocSelectors.canCurrentUserEditSelector(state, ownProps),
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

        addDataDocEditor: (uid: number, read: boolean, write: boolean) =>
            dispatch(
                dataDocActions.addDataDocEditors(
                    ownProps.docId,
                    uid,
                    read,
                    write
                )
            ),

        updateDataDocOwner: (nextOwnerId: number) => {
            dispatch(
                dataDocActions.updateDataDocOwner(ownProps.docId, nextOwnerId)
            );
        },
    };
}

export const DataDocViewersBadge = connect(
    mapStateToProps,
    mapDispatchToProps
)(DataDocViewersBadgeComponent);

import clsx from 'clsx';
import * as React from 'react';

import { AccessRequestButton } from 'components/AccessRequestButton/AccessRequestButton';
import { AccessRequestPermissionPicker } from 'components/AccessRequestPermissionPicker/AccessRequestPermissionPicker';
import { ViewerPermissionPicker } from 'components/DataDocViewersList/ViewerPermissionPicker';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { UserSelect } from 'components/UserSelect/UserSelect';
import { IAccessRequest } from 'const/accessRequest';
import { IViewerInfo, Permission } from 'lib/data-doc/datadoc-permission';
import { StyledText } from 'ui/StyledText/StyledText';
import { Tabs } from 'ui/Tabs/Tabs';

import './ViewersList.scss';

interface IProps {
    className?: string;
    entityName: string;

    readonly: boolean;

    isPublic: boolean;
    isOwner: boolean;

    infoToShow: IViewerInfo[];
    accessRequestsByUid: Record<number, IAccessRequest>;

    onPublicToggle: (checked: boolean) => void;
    onAccessRequest: () => any;
    onUserSelect: (uid: number) => void;
    onPermissionChange: (permission: Permission, uid: number) => void;
    onRemoveEditor: (uid: number) => void;

    addEditor: (uid: number, permission: Permission) => any;
    rejectAccessRequest: (uid: number) => any;
}

export const ViewersList: React.FunctionComponent<IProps> = ({
    className = '',
    entityName,
    readonly,
    isPublic,
    onPublicToggle,
    onAccessRequest,
    onUserSelect,
    infoToShow,
    onPermissionChange,
    accessRequestsByUid,
    onRemoveEditor,
    addEditor,
    rejectAccessRequest,
    isOwner,
}) => {
    const viewersListClassName = clsx({
        ViewersList: true,
        [className]: true,
    });
    return (
        <div className={viewersListClassName}>
            <div className="public-row-switch">
                <Tabs
                    selectedTabKey={isPublic ? 'Public' : 'Private'}
                    pills
                    align="center"
                    items={['Private', 'Public']}
                    onSelect={
                        readonly
                            ? null
                            : (checked) => onPublicToggle(checked === 'Public')
                    }
                    disabled={readonly}
                />
            </div>
            <div className="flex-column">
                <StyledText color="light" noUserSelect>
                    {isPublic
                        ? `This ${entityName} can be viewed by anyone`
                        : `Only invited users can view this ${entityName}`}
                </StyledText>
                {readonly ? (
                    <div className="mt12">
                        <AccessRequestButton
                            onAccessRequest={onAccessRequest}
                            isEdit
                        />
                    </div>
                ) : null}
            </div>
            {readonly ? null : (
                <div className="add-user-row">
                    <div className="user-select-wrapper">
                        <UserSelect
                            onSelect={onUserSelect}
                            selectProps={{
                                isClearable: true,
                            }}
                            clearAfterSelect
                        />
                    </div>
                </div>
            )}
            <div className="viewers-list-wrapper">
                {readonly
                    ? null
                    : Object.values(accessRequestsByUid).map((request) => (
                          <div key={request.uid} className="viewers-user-row">
                              <div className="user-badge-wrapper">
                                  <UserBadge
                                      isOnline={undefined}
                                      uid={request.uid}
                                  />
                              </div>
                              <div className="access-info">
                                  <AccessRequestPermissionPicker
                                      uid={request.uid}
                                      addEditor={addEditor}
                                      rejectAccessRequest={rejectAccessRequest}
                                  />
                              </div>
                          </div>
                      ))}
                {infoToShow.map((info) => (
                    <div key={info.uid} className="viewers-user-row">
                        <div className="user-badge-wrapper">
                            <UserBadge isOnline={info.online} uid={info.uid} />
                        </div>
                        <div className="access-info">
                            <div>
                                <ViewerPermissionPicker
                                    readonly={readonly}
                                    publicDataDoc={isPublic}
                                    isOwner={isOwner}
                                    viewerInfo={info}
                                    onPermissionChange={(permission) =>
                                        onPermissionChange(permission, info.uid)
                                    }
                                    onRemoveEditor={onRemoveEditor}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

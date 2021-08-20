import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getEnumEntries } from 'lib/typescript';
import { getQueryString } from 'lib/utils/query-string';
import { useResource } from 'hooks/useResource';
import { UserRoleType } from 'const/user';

import { IStoreState } from 'redux/store/types';
import * as userActions from 'redux/user/action';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { UserSelect } from 'components/UserSelect/UserSelect';
import { AdminAuditLogButton } from 'components/AdminAuditLog/AdminAuditLogButton';

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button, TextButton } from 'ui/Button/Button';
import { Card } from 'ui/Card/Card';
import { FormField } from 'ui/Form/FormField';
import { Icon } from 'ui/Icon/Icon';
import { Level } from 'ui/Level/Level';
import { UserRoleResource } from 'resource/admin/userRole';
import { Select, makeSelectOptions } from 'ui/Select/Select';

import './AdminUserRole.scss';

export const AdminUserRole: React.FunctionComponent = () => {
    // const [userRoles, setUserRoles] = React.useState<IAdminUserRole[]>([]);
    const [displayNewForm, setDisplayNewForm] = React.useState<boolean>(
        () => getQueryString()['new'] === 'true'
    );
    const [newUserRoleState, setNewUserRoleState] = React.useState({
        uid: null,
        role: null,
    });

    const { data: userRoles, forceFetch: loadUserRoles } = useResource(
        UserRoleResource.getAll
    );

    const uid = useSelector((state: IStoreState) => state.user.myUserInfo.uid);

    const dispatch = useDispatch();
    const loginUser = React.useCallback(
        () => dispatch(userActions.loginUser()),
        []
    );

    const deleteUserRole = React.useCallback(async (userRoleId: number) => {
        await UserRoleResource.delete(userRoleId);
        await loadUserRoles();
    }, []);

    const createUserRole = React.useCallback(async () => {
        setDisplayNewForm(false);
        await UserRoleResource.create(
            newUserRoleState.uid,
            newUserRoleState.role
        );
        if (newUserRoleState.uid === uid) {
            loginUser();
        }
        await loadUserRoles();
    }, [newUserRoleState, uid]);

    // TODO: make it work for multiple roles per user
    const cardDOM = userRoles?.map((userRole) => (
        <Card
            key={userRole.id}
            title={<UserBadge uid={userRole.uid} />}
            width="100%"
            flexRow
        >
            <div className="AdminUserRole-card-roles flex-column">
                <div className="AdminUserRole-card-role">
                    <div>{UserRoleType[userRole.role]}</div>
                    <TextButton
                        title="Remove Role"
                        onClick={() => deleteUserRole(userRole.id)}
                    />
                </div>
            </div>
        </Card>
    ));

    return (
        <div className="AdminUserRole">
            <div className="AdminLanding-top">
                <Level>
                    <div className="AdminLanding-title">User Roles</div>
                    <AdminAuditLogButton itemType="admin" />
                </Level>

                <div className="AdminLanding-desc">
                    Assign roles to users for access control.
                </div>
            </div>
            <div className="AdminUserRole-content">
                <div className="AdminUserRole-new">
                    {displayNewForm ? (
                        <div className="AdminUserRole-new-form horizontal-space-between">
                            <FormField stacked label="Username">
                                <UserSelect
                                    onSelect={(selectedUid) => {
                                        setNewUserRoleState({
                                            ...newUserRoleState,
                                            uid: selectedUid,
                                        });
                                    }}
                                />
                            </FormField>
                            <FormField stacked label="Role">
                                <Select
                                    value={newUserRoleState?.role}
                                    onChange={(event) => {
                                        const value = event.target.value
                                            ? event.target.value
                                            : null;
                                        setNewUserRoleState({
                                            ...newUserRoleState,
                                            role: value,
                                        });
                                    }}
                                    withDeselect
                                >
                                    {makeSelectOptions(
                                        getEnumEntries(UserRoleType).map(
                                            ([name]) => name
                                        )
                                    )}
                                </Select>
                            </FormField>
                            <div className="AdminUserRole-new-button flex-row">
                                <Button
                                    title="Cancel"
                                    onClick={() => {
                                        setNewUserRoleState(null);
                                        setDisplayNewForm(false);
                                    }}
                                />
                                <AsyncButton
                                    title="Save"
                                    onClick={createUserRole}
                                    disabled={
                                        !newUserRoleState.uid ||
                                        !newUserRoleState.role
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <Card
                            title=""
                            width="100%"
                            flexRow
                            onClick={() => {
                                setNewUserRoleState({
                                    uid: null,
                                    role: null,
                                });
                                setDisplayNewForm(true);
                            }}
                        >
                            <div className="AdminUserRole-new-msg flex-row">
                                <Icon name="plus" />
                                <span>create a new user role</span>
                            </div>
                        </Card>
                    )}
                </div>
                <div className="AdminUserRole-roles flex-column">{cardDOM}</div>
            </div>
        </div>
    );
};

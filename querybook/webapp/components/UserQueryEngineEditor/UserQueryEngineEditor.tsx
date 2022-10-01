import React from 'react';

import { UserSelect } from 'components/UserSelect/UserSelect';
import { IUserInfo } from 'const/user';
import { usePaginatedResource } from 'hooks/usePaginatedResource';
import { AdminQueryEngineResource } from 'resource/admin';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { IconButton } from 'ui/Button/IconButton';
import {
    FormField,
    FormFieldInputSection,
    FormFieldInputSectionRow,
} from 'ui/Form/FormField';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';

import './UserQueryEngineEditor.scss';

interface IProps {
    queryEngineId: number;
}

export const UserQueryEngineEditor: React.FunctionComponent<IProps> = ({
    queryEngineId,
}) => {
    const [selectedUserId, setSelectedUserId] = React.useState<number>(null);

    const { data, hasMore, fetchMore, reset } = usePaginatedResource(
        React.useMemo(
            () => AdminQueryEngineResource.getPaginatedUsers(queryEngineId),
            [queryEngineId]
        )
    );

    const userRenderer = React.useCallback(
        (user: IUserInfo) => (
            <div className="UserQueryEngineEditor-user flex-row">
                <IconButton
                    icon="X"
                    onClick={() =>
                        AdminQueryEngineResource.removeUser(
                            queryEngineId,
                            user.id
                        ).then(reset)
                    }
                />
                <div className="UserQueryEngineEditor-username">
                    {user.username}
                </div>
            </div>
        ),
        [queryEngineId, reset]
    );

    const users: IUserInfo[] = data;

    return (
        <div className="UserQueryEngineEditor">
            <FormField stacked>
                <FormFieldInputSectionRow>
                    <FormFieldInputSection>
                        <UserSelect
                            onSelect={(uid) => setSelectedUserId(uid)}
                        />
                    </FormFieldInputSection>
                    <AsyncButton
                        title="Add User"
                        onClick={
                            selectedUserId
                                ? () =>
                                      AdminQueryEngineResource.addUser(
                                          queryEngineId,
                                          selectedUserId
                                      ).then(() => {
                                          setSelectedUserId(null);
                                          reset();
                                      })
                                : null
                        }
                        disabled={!selectedUserId}
                        className="ml8"
                    />
                </FormFieldInputSectionRow>
            </FormField>
            <div className="UserQueryEngineEditor-list">
                <InfinityScroll<IUserInfo>
                    elements={users}
                    hasMore={hasMore}
                    onLoadMore={fetchMore}
                    itemRenderer={userRenderer}
                    itemHeight={28}
                />
            </div>
        </div>
    );
};

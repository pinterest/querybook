import React from 'react';
import { IUserInfo } from 'const/user';
import { UserSelect } from 'components/UserSelect/UserSelect';
import { usePaginatedResource } from 'hooks/usePaginatedResource';
import { AdminEnvironmentResource } from 'resource/admin';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import {
    FormField,
    FormFieldInputSectionRow,
    FormFieldInputSection,
} from 'ui/Form/FormField';
import { IconButton } from 'ui/Button/IconButton';
import './UserEnvironmentEditor.scss';

interface IProps {
    environmentId: number;
}

export const UserEnvironmentEditor: React.FunctionComponent<IProps> = ({
    environmentId,
}) => {
    const [selectedUserId, setSelectedUserId] = React.useState<number>(null);

    const { data, hasMore, fetchMore, reset } = usePaginatedResource(
        React.useMemo(
            () => AdminEnvironmentResource.getPaginatedUsers(environmentId),
            [environmentId]
        )
    );

    const userRenderer = React.useCallback(
        (user: IUserInfo) => (
            <div className="UserEnvironmentEditor-user flex-row">
                <IconButton
                    icon="x"
                    onClick={() =>
                        AdminEnvironmentResource.removeUser(
                            environmentId,
                            user.id
                        ).then(reset)
                    }
                />
                <div className="UserEnvironmentEditor-username">
                    {user.username}
                </div>
            </div>
        ),
        [environmentId, reset]
    );

    const users: IUserInfo[] = data;

    return (
        <div className="UserEnvironmentEditor">
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
                                      AdminEnvironmentResource.addUser(
                                          environmentId,
                                          selectedUserId
                                      ).then(() => {
                                          setSelectedUserId(null);
                                          reset();
                                      })
                                : null
                        }
                        disabled={!selectedUserId}
                    />
                </FormFieldInputSectionRow>
            </FormField>
            <div className="UserEnvironmentEditor-list">
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

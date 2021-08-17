import React from 'react';
import { IUserInfo } from 'const/user';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';

import ds from 'lib/datasource';
import { usePaginatedFetch } from 'hooks/usePaginatedFetch';

import { UserSelect } from 'components/UserSelect/UserSelect';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';

import './UserEnvironmentEditor.scss';
import {
    FormField,
    FormFieldInputSectionRow,
    FormFieldInputSection,
} from 'ui/Form/FormField';
import { IconButton } from 'ui/Button/IconButton';

interface IProps {
    environmentId: number;
}

export const UserEnvironmentEditor: React.FunctionComponent<IProps> = ({
    environmentId,
}) => {
    const [selectedUserId, setSelectedUserId] = React.useState<number>(null);

    const { data, hasMore, fetchMore, reset } = usePaginatedFetch<IUserInfo>({
        url: `/admin/environment/${environmentId}/users/`,
    });

    const userRenderer = React.useCallback(
        (user: IUserInfo) => (
            <div className="UserEnvironmentEditor-user flex-row">
                <IconButton
                    icon="x"
                    onClick={() =>
                        ds
                            .delete(
                                `/admin/environment/${environmentId}/user/${user.id}/`
                            )
                            .then(reset)
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
                                      ds
                                          .save(
                                              `/admin/environment/${environmentId}/user/${selectedUserId}/`
                                          )
                                          .then(() => {
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

import React from 'react';
import AsyncSelect, { Props as AsyncProps } from 'react-select/async';
import { debounce } from 'lodash';

import {
    asyncReactSelectStyles,
    makeReactSelectStyle,
} from 'lib/utils/react-select';
import { overlayRoot } from 'ui/Overlay/Overlay';
import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { SearchUserResource } from 'resource/search';
import { AccentText } from 'ui/StyledText/StyledText';

interface IUserSearchResultRow {
    id: number;
    username: string;
    fullname: string;
}

function getUserName(user: IUserSearchResultRow) {
    return (user.fullname || user.username || 'No Name').trim();
}

const loadOptions = debounce(
    (name, callback) => {
        SearchUserResource.search({ name }).then(({ data }) => {
            callback(
                data.map((user) => ({
                    value: user.id,
                    label: <UserSelectOptionRow user={user} />,
                    name: getUserName(user),
                }))
            );
        });
    },
    1000,
    {
        leading: true,
    }
);

interface IUserSelectProps {
    onSelect: (uid: number, name: string) => any;
    usePortalMenu?: boolean;

    selectProps?: Partial<AsyncProps<any, false>>;

    // remove the selected user name after select
    clearAfterSelect?: boolean;
}

export const UserSelect: React.FunctionComponent<IUserSelectProps> = ({
    onSelect,
    usePortalMenu = true,
    selectProps = {},
    clearAfterSelect = false,
}) => {
    const [searchText, setSearchText] = React.useState('');
    const asyncSelectProps: Partial<AsyncProps<any, false>> = {};
    const userReactSelectStyle = React.useMemo(
        () => makeReactSelectStyle(usePortalMenu, asyncReactSelectStyles),
        [usePortalMenu]
    );
    if (usePortalMenu) {
        asyncSelectProps.menuPortalTarget = overlayRoot;
    }
    if (clearAfterSelect) {
        asyncSelectProps.value = null;
    }

    return (
        <AccentText>
            <AsyncSelect
                styles={userReactSelectStyle}
                placeholder={'username'}
                onChange={(option: any) => {
                    if (option) {
                        onSelect(option.value, option.name);
                    } else {
                        onSelect(null, null);
                    }
                }}
                loadOptions={loadOptions}
                defaultOptions={[]}
                inputValue={searchText}
                onInputChange={(text) => setSearchText(text)}
                noOptionsMessage={() => (searchText ? 'No user found.' : null)}
                {...asyncSelectProps}
                {...selectProps}
            />
        </AccentText>
    );
};

const UserSelectOptionRow: React.FC<{ user: IUserSearchResultRow }> = ({
    user,
}) => {
    const name = React.useMemo(() => getUserName(user), [user]);
    return (
        <div className="flex-row">
            <UserAvatar tiny uid={user.id} />
            <span className="ml4">{name}</span>
        </div>
    );
};

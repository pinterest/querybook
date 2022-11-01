import { debounce } from 'lodash';
import React, { ReactElement, useMemo } from 'react';
import AsyncCreatableSelect, {
    Props as AsyncCreatableProps,
} from 'react-select/async-creatable';

import { UserBadge } from 'components/UserBadge/UserBadge';
import {
    makeReactSelectStyle,
    multiCreatableReactSelectStyles,
} from 'lib/utils/react-select';
import { SearchUserResource } from 'resource/search';
import { overlayRoot } from 'ui/Overlay/Overlay';
import { AccentText } from 'ui/StyledText/StyledText';

interface IUserSearchResultRow {
    id: number;
    username: string;
    fullname: string;
}

interface ISelectFreeOption {
    label?: string | ReactElement;
    value: string;
}

interface ISelectUserOption {
    label?: string | ReactElement;
    value: number;
    isUser: boolean;
}

type ISelectOption = ISelectFreeOption | ISelectUserOption;

function getUserName(user: IUserSearchResultRow) {
    return (user.fullname || user.username || 'Unknown').trim();
}

const loadOptions = debounce(
    (name, callback) => {
        SearchUserResource.search({ name }).then(({ data }) => {
            callback(
                data.map((user: IUserSearchResultRow) => ({
                    value: user.id,
                    label: (
                        <UserBadge
                            uid={user.id}
                            name={getUserName(user)}
                            mini
                        />
                    ),
                    isUser: true,
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
    value: ISelectOption[] | undefined;
    onChange: (values: ISelectOption[]) => any;
    usePortalMenu?: boolean;
    selectProps?: Partial<AsyncCreatableProps<any, boolean>>;
}

export const MultiCreatableUserSelect: React.FunctionComponent<
    IUserSelectProps
> = ({ value, onChange, usePortalMenu = true, selectProps = {} }) => {
    const [searchText, setSearchText] = React.useState('');
    const userReactSelectStyle = React.useMemo(
        () =>
            makeReactSelectStyle(
                usePortalMenu,
                multiCreatableReactSelectStyles
            ),
        [usePortalMenu]
    );
    if (usePortalMenu) {
        selectProps.menuPortalTarget = overlayRoot;
    }

    const valueWithLabel = useMemo(
        () =>
            (value ?? []).map((v) => ({
                ...v,
                label:
                    v.label ??
                    ('isUser' in v && v.isUser ? (
                        <UserBadge uid={v.value} mini />
                    ) : (
                        v.value
                    )),
            })),
        [value]
    );

    return (
        <AccentText>
            <AsyncCreatableSelect
                styles={userReactSelectStyle}
                loadOptions={loadOptions}
                defaultOptions={[]}
                inputValue={searchText}
                onInputChange={(text) => setSearchText(text)}
                noOptionsMessage={() => (searchText ? 'No user found.' : null)}
                allowCreateWhileLoading
                onChange={onChange}
                value={valueWithLabel}
                isMulti
                {...selectProps}
            />
        </AccentText>
    );
};

import moment from 'moment';
import React from 'react';

import { UserName } from 'components/UserBadge/UserName';
import { IAdminApiAccessToken } from 'const/admin';
import { generateFormattedDate } from 'lib/utils/datetime';
import { AdminTokenResource } from 'resource/admin';
import { Table, TableAlign } from 'ui/Table/Table';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

import './AdminApiAccessToken.scss';

const tableColumns = [
    'id',
    'created_at',
    'creator_uid',
    'updated_at',
    'updater_uid',
    'enabled',
];
const tableColumnWidths = {
    id: 80,
    created_at: 280,
    updated_at: 280,
    creator_uid: 160,
    updater_uid: 160,
    enabled: 100,
};
const tableColumnAligns: Record<string, TableAlign> = {
    id: 'center',
    creator_uid: 'center',
    updater_uid: 'center',
    enabled: 'center',
};

export const AdminApiAccessToken: React.FunctionComponent = () => {
    const [tokenList, setTokenList] = React.useState(
        [] as IAdminApiAccessToken[]
    );

    const getAllApiAccessTokens = React.useCallback(async () => {
        const resp = await AdminTokenResource.getAll();
        setTokenList(resp.data);
    }, []);

    React.useEffect(() => {
        getAllApiAccessTokens();
    }, []);

    const handleChangeEnabled = React.useCallback(
        async (tokenId: number, val: boolean) => {
            const resp = await AdminTokenResource.toggleEnabled(tokenId, val);
            if (resp) {
                getAllApiAccessTokens();
            }
        },
        []
    );

    const formatCell = React.useCallback(
        (index: number, column: string, row: IAdminApiAccessToken) => {
            const key = column;
            const value = row[key];
            const tokenId = row.id;
            let dom = value;
            switch (key) {
                case 'created_at': {
                    dom = (
                        <span>
                            {generateFormattedDate(value, 'X')},{' '}
                            {moment.utc(value, 'X').fromNow()}
                        </span>
                    );
                    break;
                }
                case 'updated_at': {
                    dom = (
                        <span>
                            {generateFormattedDate(value, 'X')},{' '}
                            {moment.utc(value, 'X').fromNow()}
                        </span>
                    );
                    break;
                }
                case 'creator_uid': {
                    dom = <UserName uid={value} />;
                    break;
                }
                case 'updater_uid': {
                    dom = <UserName uid={value} />;
                    break;
                }
                case 'enabled': {
                    dom = (
                        <ToggleSwitch
                            checked={value}
                            onChange={(val) =>
                                handleChangeEnabled(tokenId, val)
                            }
                        />
                    );
                    break;
                }
            }
            return (
                <div className={`div-${key}`} key={`${tokenId}-${key}`}>
                    {dom}
                </div>
            );
        },
        []
    );

    return (
        <div className="AdminApiAccessToken">
            <div className="AdminLanding-top">
                <div className="AdminLanding-title">API Acess Tokens</div>
                <div className="AdminLanding-desc">
                    Access Tokens can be created by any user and used to make
                    API calls.
                </div>
            </div>
            <div className="AdminApiAccessToken-content">
                {tokenList.length ? (
                    <Table
                        rows={tokenList}
                        cols={tableColumns}
                        formatCell={formatCell}
                        colNameToWidths={tableColumnWidths}
                        colNameToTextAlign={tableColumnAligns}
                        showAllRows={true}
                    />
                ) : null}
            </div>
        </div>
    );
};

import React from 'react';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { generateFormattedDate } from 'lib/utils/datetime';

import './GenericGridItem.scss';

interface IProps {
    title: string;
    snippet?: string;
    date: number;
    uid?: number;
    onClick?: () => any;
}

export const GenericGridItem: React.FunctionComponent<IProps> = ({
    title,
    snippet,
    date,
    uid,
    onClick,
}) => {
    const userBadgeDOM = uid != null ? <UserBadge uid={uid} /> : null;

    return (
        <div className="GenericGridItem">
            <a className="grid-item-content" onClick={onClick}>
                <div className="grid-item-top">
                    <div className="grid-item-top-inner">
                        <div className="grid-item-title title is-4">
                            {title}
                        </div>
                        <div className="snippet content">{snippet}</div>
                    </div>
                </div>
                <div className="grid-item-bottom">
                    <div className="grid-item-date subtitle is-6">
                        {generateFormattedDate(date, 'X')}
                    </div>
                    {userBadgeDOM}
                </div>
            </a>
        </div>
    );
};

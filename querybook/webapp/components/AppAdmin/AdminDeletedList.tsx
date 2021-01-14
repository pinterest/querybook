import * as React from 'react';
import moment from 'moment';
import { Card } from 'ui/Card/Card';
import { Button } from 'ui/Button/Button';

import './AdminDeletedList.scss';

interface IProps<T> {
    items?: T[];
    onRecover: (itemId: number) => any;
    keysToShow: Array<keyof T>;
}

export function AdminDeletedList<T extends { id: number; name: string }>({
    items,
    onRecover,
    keysToShow,
}: IProps<T>) {
    const getKeyValDOM = (key: keyof T, val: any) => {
        let valDOM = val;

        if (typeof val === 'boolean') {
            valDOM = val ? 'true' : 'false';
        } else if (typeof val === 'object') {
            valDOM = JSON.stringify(val, null, 2);
        } else if (typeof val === 'number') {
            valDOM = moment(val * 1000).format('lll');
        }
        return (
            <div className="AdminDeletedList-key-val" key={key as string}>
                {key}: {valDOM}
            </div>
        );
    };

    return (
        <div className="AdminDeletedList">
            {items?.map((item) => (
                <Card key={item.id} title={item.name} width="360px">
                    <div className="AdminDeletedList-content">
                        {keysToShow.map((key) => getKeyValDOM(key, item[key]))}
                    </div>
                    <div className="AdminDeletedList-button-wrapper">
                        <Button onClick={() => onRecover(item.id)}>
                            Recover Item
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}

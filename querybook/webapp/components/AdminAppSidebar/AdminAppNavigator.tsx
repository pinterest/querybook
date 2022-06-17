import * as React from 'react';
import { useRouteMatch } from 'react-router-dom';

import { AdminEntity, IAdminEntity } from 'components/AppAdmin/types';
import history from 'lib/router-history';
import { titleize } from 'lib/utils';
import { IconButton } from 'ui/Button/IconButton';
import { ListLink } from 'ui/Link/ListLink';
import { SearchBar } from 'ui/SearchBar/SearchBar';

import './AdminAppNavigator.scss';

interface IProps {
    selectedEntity: AdminEntity;
    entityList: IAdminEntity[];
    placeholder: string;
}

export const AdminAppNavigator: React.FunctionComponent<IProps> = ({
    selectedEntity,
    entityList,
    placeholder,
}) => {
    const [titleFilterString, setTitleFilterString] = React.useState('');

    const {
        params: { entityId },
    } = useRouteMatch('/admin/:entity/:entityId?/');

    React.useEffect(() => {
        setTitleFilterString('');
    }, [selectedEntity]);

    const filteredEntityList = React.useMemo(() => {
        if (entityList) {
            const lowerCaseTitleFilterString = (
                titleFilterString || ''
            ).toLowerCase();
            return entityList.filter(
                (entity) =>
                    !entity.deleted &&
                    (entity.name
                        .toLowerCase()
                        .includes(lowerCaseTitleFilterString) ||
                        (entity.searchField &&
                            entity.searchField
                                .toLowerCase()
                                .includes(lowerCaseTitleFilterString)))
            );
        } else {
            return [];
        }
    }, [entityList, titleFilterString]);

    const tooltipString = React.useMemo(
        () => `New ${titleize(selectedEntity, '_', ' ')}`,
        [selectedEntity]
    );

    return (
        <div className="AdminAppNavigator ph8">
            <div className="AdminAppNavigator-top flex-row">
                <SearchBar
                    value={titleFilterString}
                    onSearch={(filterString) =>
                        setTitleFilterString(filterString)
                    }
                    placeholder={placeholder}
                    transparent
                />
                <IconButton
                    icon="Plus"
                    tooltip={tooltipString}
                    tooltipPos="left"
                    onClick={() =>
                        history.push(`/admin/${selectedEntity}/new/`)
                    }
                />
            </div>
            <div className="AdminAppNavigator-items">
                {filteredEntityList.map((item) => {
                    const url = `/admin/${selectedEntity}/${item.id}/`;
                    return (
                        <ListLink
                            className={
                                Number(entityId) === item.id
                                    ? 'AdminAppNavigator-item selected'
                                    : 'AdminAppNavigator-item'
                            }
                            onClick={() => history.push(url)}
                            key={item.id}
                            to={url}
                            title={item.name}
                        />
                    );
                })}
                <IconButton
                    icon="Trash2"
                    tooltip={`Manage Deleted ${titleize(
                        selectedEntity,
                        '_',
                        ' '
                    )}s`}
                    tooltipPos="left"
                    onClick={() =>
                        history.push(`/admin/${selectedEntity}/deleted/`)
                    }
                />
            </div>
        </div>
    );
};

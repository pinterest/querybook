import React, { useState, useEffect } from 'react';
import * as classNames from 'classnames';

import { IDataDoc } from 'const/datadoc';
import { DataDocGridItem } from './DataDocGridItem';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { Title } from 'ui/Title/Title';
import { IconButton } from 'ui/Button/IconButton';
import { LoadingIcon } from 'ui/Loading/Loading';

import './DataDocNavigatorSection.scss';

interface INavigatorSectionProps {
    className?: string;
    selectedDocId: number;
    dataDocs: IDataDoc[];
    sectionHeader?: string;
    defaultCollapsed?: boolean;
    loaded?: boolean;

    loadDataDocs?: () => void;
    onDrop?: (item: IDataDoc) => void;
}

export const DataDocNavigatorSection: React.FC<INavigatorSectionProps> = ({
    className,
    selectedDocId,
    dataDocs,

    sectionHeader,
    defaultCollapsed = false,
    loaded = false,
    onDrop,
    loadDataDocs,
}) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    useEffect(() => {
        if (!collapsed && !loaded && loadDataDocs) {
            loadDataDocs();
        }
    }, [collapsed]);

    const makeDataDocListDOM = () => {
        const listDOM = dataDocs.map((dataDoc) => {
            const docId = dataDoc.id;

            const itemClassName = classNames({
                selected: selectedDocId === docId,
            });

            return (
                <DataDocGridItem
                    key={docId}
                    dataDoc={dataDoc}
                    className={itemClassName}
                    url={getWithinEnvUrl(`/datadoc/${docId}/`)}
                />
            );
        });

        return listDOM;
    };

    const headerSectionDOM = sectionHeader ? (
        <div
            className="horizontal-space-between navigator-header pl8"
            onClick={() => setCollapsed(!collapsed)}
        >
            <Title size={7}>{sectionHeader}</Title>
            <IconButton icon={collapsed ? 'chevron-right' : 'chevron-down'} />
        </div>
    ) : null;

    const dataDocListDOM = collapsed ? null : !loaded ? (
        <div className="center-align">
            <LoadingIcon />
        </div>
    ) : (
        <div>{makeDataDocListDOM()}</div>
    );

    return (
        <div className={'DataDocNavigatorSection mb12 ' + (className ?? '')}>
            {headerSectionDOM}
            {dataDocListDOM}
        </div>
    );
};

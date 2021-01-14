import React, { useState, useEffect, useMemo } from 'react';
import * as classNames from 'classnames';
import { orderBy } from 'lodash';

import { IDataDoc } from 'const/datadoc';
import { DataDocGridItem } from './DataDocGridItem';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { Title } from 'ui/Title/Title';
import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { LoadingIcon } from 'ui/Loading/Loading';

import './DataDocNavigatorSection.scss';
import { TextToggleButton } from 'ui/Button/TextToggleButton';

interface INavigatorSectionProps {
    className?: string;
    selectedDocId: number;
    filterString: string;
    dataDocs: IDataDoc[];

    sectionHeader?: string;
    sectionHeaderIcon?: string;

    loaded?: boolean;

    allowReorder?: boolean;

    loadDataDocs?: () => void;
    onRemove?: (item: IDataDoc) => void;

    collapsed: boolean;
    setCollapsed: (v: boolean) => any;
}

type DataDocOrderBy = 'default' | 'alphabetical';

export const DataDocNavigatorSection: React.FC<INavigatorSectionProps> = ({
    className,
    selectedDocId,
    filterString,
    dataDocs,

    sectionHeader,
    sectionHeaderIcon,

    loaded = false,
    onRemove,
    loadDataDocs,
    allowReorder,

    collapsed,
    setCollapsed,
}) => {
    const [dataDocOrderBy, setOrderBy] = useState<DataDocOrderBy>('default');
    useEffect(() => {
        if (!collapsed && !loaded && loadDataDocs) {
            loadDataDocs();
        }
    }, [collapsed]);

    const filteredDataDocs = useFilteredDataDocs(
        dataDocs,
        filterString,
        collapsed
    );
    const orderedDataDocs = useMemo(
        () =>
            dataDocOrderBy === 'default'
                ? filteredDataDocs
                : orderBy(filteredDataDocs, 'title'),
        [dataDocOrderBy, filteredDataDocs]
    );

    const makeDataDocListDOM = () => {
        if (orderedDataDocs.length === 0) {
            return <div className="ph12">No items in this section.</div>;
        }

        const listDOM = orderedDataDocs.map((dataDoc) => {
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
                    onRemove={onRemove}
                />
            );
        });

        return listDOM;
    };

    const headerSectionDOM = sectionHeader ? (
        <div className="horizontal-space-between navigator-header pl8">
            <div
                className="flex1 flex-row"
                onClick={() => setCollapsed(!collapsed)}
            >
                {sectionHeaderIcon && (
                    <Icon size={18} className="mr8" name={sectionHeaderIcon} />
                )}
                <Title size={7}>{sectionHeader}</Title>
            </div>
            <div className="flex-row">
                {allowReorder && (
                    <TextToggleButton
                        value={dataDocOrderBy === 'alphabetical'}
                        onChange={(v) =>
                            setOrderBy(v ? 'alphabetical' : 'default')
                        }
                        tooltip={
                            dataDocOrderBy === 'alphabetical'
                                ? 'Order By Last Edited Time'
                                : 'Order By Title'
                        }
                        tooltipPos="left"
                        text={'↓Aa'}
                    />
                )}
                <IconButton
                    onClick={() => setCollapsed(!collapsed)}
                    icon={collapsed ? 'chevron-right' : 'chevron-down'}
                    className="ml4"
                />
            </div>
        </div>
    ) : null;

    const dataDocListDOM = collapsed ? null : !loaded ? (
        <div className="center-align mt12 mb4">
            <LoadingIcon />
        </div>
    ) : (
        <div>{makeDataDocListDOM()}</div>
    );

    return (
        <div className={'DataDocNavigatorSection ' + (className ?? '')}>
            {headerSectionDOM}
            {dataDocListDOM}
        </div>
    );
};

function useFilteredDataDocs(
    dataDocs: IDataDoc[],
    filterString: string,
    collapsed: boolean
) {
    const filteredDataDocs = useMemo(
        () =>
            collapsed
                ? []
                : dataDocs.filter(
                      (dataDoc) =>
                          !!dataDoc?.title.toLowerCase().includes(filterString)
                  ),
        [dataDocs, filterString, collapsed]
    );
    return filteredDataDocs;
}

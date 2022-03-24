import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { orderBy } from 'lodash';

import { IDataDoc } from 'const/datadoc';
import { DataDocGridItem } from './DataDocGridItem';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { Title } from 'ui/Title/Title';
import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { LoadingIcon } from 'ui/Loading/Loading';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { OrderByButton } from 'ui/OrderByButton/OrderByButton';

import { titleize } from 'lib/utils';

interface INavigatorSectionProps {
    className?: string;
    selectedDocId: number;
    filterString: string;
    dataDocs: IDataDoc[];

    sectionHeader?: string;
    sectionHeaderIcon?: AllLucideIconNames;

    loaded?: boolean;

    allowReorder?: boolean;

    loadDataDocs?: () => void;
    onRemove?: (item: IDataDoc) => void;

    collapsed: boolean;
    setCollapsed: (v: boolean) => any;
}

type DataDocOrderBy = 'default' | 'alphabetical';

export const DataDocNavigatorSection: React.FC<INavigatorSectionProps> = ({
    className = '',
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
    const [dataDocOrderByAsc, setDataDocOrderByAsc] = useState(false);
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
    const orderedDataDocs = useMemo(() => {
        // the default order of filteredDataDocs is descending by
        // last editing time
        // so we ensure all ordering is down by descending
        const orderedDocs =
            dataDocOrderBy === 'default'
                ? filteredDataDocs
                : orderBy(filteredDataDocs, 'title', 'desc');

        return dataDocOrderByAsc ? [...orderedDocs].reverse() : orderedDocs;
    }, [dataDocOrderBy, filteredDataDocs, dataDocOrderByAsc]);

    const makeDataDocListDOM = () => {
        if (orderedDataDocs.length === 0) {
            return (
                <div className="empty-section-message">
                    No{' '}
                    {sectionHeader === 'my docs'
                        ? 'docs'
                        : sectionHeader?.toLowerCase()}
                </div>
            );
        }

        const listDOM = orderedDataDocs.map((dataDoc) => {
            const docId = dataDoc.id;

            const itemClassName = clsx({
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
                <Title size="small">{titleize(sectionHeader)}</Title>
            </div>
            <div className="flex-row">
                {allowReorder && (
                    <OrderByButton
                        asc={dataDocOrderByAsc}
                        onAscToggle={() => setDataDocOrderByAsc((v) => !v)}
                        orderByFieldSymbol={
                            dataDocOrderBy === 'alphabetical' ? 'Aa' : 'U@'
                        }
                        orderByField={
                            dataDocOrderBy === 'alphabetical'
                                ? 'title'
                                : 'last updated time'
                        }
                        onOrderByFieldToggle={() =>
                            setOrderBy((v) =>
                                v === 'alphabetical'
                                    ? 'default'
                                    : 'alphabetical'
                            )
                        }
                    />
                )}
                <IconButton
                    onClick={() => setCollapsed(!collapsed)}
                    icon={collapsed ? 'ChevronRight' : 'ChevronDown'}
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
        <div className={'DataDocNavigatorSection mb12 ' + className}>
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

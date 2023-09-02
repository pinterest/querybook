import React, { useCallback, useState } from 'react';
import AsyncSelect, { Props as AsyncProps } from 'react-select/async';

import { TableTooltipByName } from 'components/CodeMirrorTooltip/TableTooltip';
import {
    asyncReactSelectStyles,
    makeReactSelectStyle,
} from 'lib/utils/react-select';
import { SearchTableResource } from 'resource/search';
import { overlayRoot } from 'ui/Overlay/Overlay';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { HoverIconTag } from 'ui/Tag/HoverIconTag';

interface ITableSelectProps {
    metastoreId: number;
    tableNames: string[];
    onTableNamesChange: (tableNames: string[]) => void;
    usePortalMenu?: boolean;

    selectProps?: Partial<AsyncProps<any, false>>;

    // remove the selected table name after select
    clearAfterSelect?: boolean;
    showTablePopoverTooltip?: boolean;
}

export const TableSelector: React.FunctionComponent<ITableSelectProps> = ({
    metastoreId,
    tableNames,
    onTableNamesChange,
    usePortalMenu = true,
    selectProps = {},
    clearAfterSelect = false,
    showTablePopoverTooltip = false,
}) => {
    const [searchText, setSearchText] = useState('');
    const asyncSelectProps: Partial<AsyncProps<any, false>> = {};
    const tableReactSelectStyle = React.useMemo(
        () => makeReactSelectStyle(usePortalMenu, asyncReactSelectStyles),
        [usePortalMenu]
    );
    if (usePortalMenu) {
        asyncSelectProps.menuPortalTarget = overlayRoot;
    }
    if (clearAfterSelect) {
        asyncSelectProps.value = null;
    }

    const loadOptions = useCallback(
        async (tableName: string) => {
            const { data } = await SearchTableResource.searchConcise({
                metastore_id: metastoreId,
                keywords: tableName,
            });
            const filteredTableNames = data.results.filter(
                (result) =>
                    tableNames.indexOf(`${result.schema}.${result.name}`) === -1
            );
            const tableNameOptions = filteredTableNames.map(
                ({ id, schema, name }) => ({
                    value: id,
                    label: `${schema}.${name}`,
                })
            );
            return tableNameOptions;
        },
        [metastoreId, tableNames]
    );

    const getTableTagDOM = (tableName) => (
        <PopoverHoverWrapper>
            {(showPopover, anchorElement) => (
                <>
                    <HoverIconTag
                        name={tableName}
                        iconOnHover="X"
                        onIconHoverClick={() => {
                            const newTableNames = tableNames.filter(
                                (name) => name !== tableName
                            );
                            onTableNamesChange(newTableNames);
                        }}
                        tooltip={showTablePopoverTooltip ? null : tableName}
                        tooltipPos="right"
                        mini
                        highlighted
                        light
                    />
                    {showTablePopoverTooltip && showPopover && (
                        <Popover
                            onHide={() => null}
                            anchor={anchorElement}
                            layout={['right']}
                        >
                            <TableTooltipByName
                                metastoreId={metastoreId}
                                tableFullName={tableName}
                            />
                        </Popover>
                    )}
                </>
            )}
        </PopoverHoverWrapper>
    );
    return (
        <div className="TableSelect">
            <AsyncSelect
                styles={tableReactSelectStyle}
                placeholder={'search table name'}
                onChange={(option: any) => {
                    const newTableName = option?.label ?? null;
                    if (newTableName == null) {
                        onTableNamesChange([]);
                        return;
                    }
                    const newTableNames = tableNames.concat(newTableName);
                    onTableNamesChange(newTableNames);
                }}
                loadOptions={loadOptions}
                defaultOptions={[]}
                inputValue={searchText}
                onInputChange={(text) => setSearchText(text)}
                noOptionsMessage={() => (searchText ? 'No table found.' : null)}
                {...asyncSelectProps}
                {...selectProps}
            />
            {tableNames.length ? (
                <div className="flex-row flex-wrap mt8 gap8">
                    {tableNames.map((tableName) => (
                        <div key={tableName}>{getTableTagDOM(tableName)}</div>
                    ))}
                </div>
            ) : null}
        </div>
    );
};
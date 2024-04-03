import React, { useCallback, useMemo, useState } from 'react';
import { components, MultiValueProps } from 'react-select';
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

interface ITableSelectProps {
    metastoreId: number;
    tableNames: string[];
    onTableNamesChange: (tableNames: string[]) => void;
    usePortalMenu?: boolean;
    selectProps?: Partial<AsyncProps<any, false>>;
    clearAfterSelect?: boolean;
}

export const TableSelector: React.FunctionComponent<ITableSelectProps> = ({
    metastoreId,
    tableNames,
    onTableNamesChange,
    usePortalMenu = true,
    selectProps = {},
    clearAfterSelect = false,
}) => {
    const [searchText, setSearchText] = useState('');
    const asyncSelectProps: Partial<AsyncProps<any, false>> = {};
    const tableReactSelectStyle = React.useMemo(
        () =>
            makeReactSelectStyle(usePortalMenu, {
                ...asyncReactSelectStyles,
                multiValue: (styles) => {
                    return {
                        ...styles,
                        color: 'var(--color-accent-dark)',
                        backgroundColor: 'var(--color-accent-lightest-0)',
                    };
                },
            }),
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
                    value: `${schema}.${name}`,
                    label: `${schema}.${name}`,
                })
            );
            return tableNameOptions;
        },
        [metastoreId, tableNames]
    );

    const MultiValueTableContainer = useMemo(
        () => (props: MultiValueProps<{ label: string; value: string }>) => {
            return (
                <PopoverHoverWrapper>
                    {(showPopover, anchorElement) => (
                        <>
                            <components.MultiValueContainer {...props} />
                            {showPopover && (
                                <Popover
                                    onHide={() => null}
                                    anchor={anchorElement}
                                    layout={['right']}
                                >
                                    <TableTooltipByName
                                        metastoreId={metastoreId}
                                        tableFullName={props.data.value}
                                        showDetails={true}
                                    />
                                </Popover>
                            )}
                        </>
                    )}
                </PopoverHoverWrapper>
            );
        },
        [metastoreId]
    );

    return (
        <AsyncSelect
            styles={tableReactSelectStyle}
            placeholder={'search table name'}
            onChange={(options: any) => {
                onTableNamesChange(options.map((option) => option.value));
            }}
            loadOptions={loadOptions}
            defaultOptions={[]}
            inputValue={searchText}
            value={tableNames.map((tableName) => ({
                value: tableName,
                label: tableName,
            }))}
            onInputChange={(text) => setSearchText(text)}
            noOptionsMessage={() => (searchText ? 'No table found.' : null)}
            isMulti
            components={{
                MultiValueContainer: MultiValueTableContainer,
            }}
            {...asyncSelectProps}
            {...selectProps}
        />
    );
};

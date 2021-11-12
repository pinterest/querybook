import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import { SchemaTableSortKey } from 'const/metastore';
import { Dispatch, IStoreState } from 'redux/store/types';
import type { ITableSearchResult } from 'redux/dataTableSearch/types';
import { defaultSortSchemaTableBy } from 'redux/dataTableSearch/const';
import { useIntersectionObserver } from 'hooks/useIntersectionObserver';

import {
    searchSchemas,
    searchTableBySchema,
    changeTableSort,
} from 'redux/dataTableSearch/action';

import { SchemaTableItem } from './SchemaTableItem';

const SchemasList = styled.div`
    flex: 1 1 200px;
    overflow-y: auto;
`;

const IntersectionElement = styled.div`
    width: 100%;
    height: 1px;
`;

export const SchemaTableView: React.FunctionComponent<{
    tableRowRenderer: (table: ITableSearchResult) => React.ReactNode;
    selectedTableId: number;
}> = ({ tableRowRenderer, selectedTableId }) => {
    const schemas = useSelector(
        (state: IStoreState) => state.dataTableSearch.schemas
    );

    const dispatch: Dispatch = useDispatch();
    const [intersectElement, setIntersectElement] = useState<HTMLDivElement>(
        null
    );

    useIntersectionObserver({
        intersectElement,
        onIntersect: () => {
            dispatch(searchSchemas());
        },
        deps: [schemas.schemaIds],
        disabled: schemas.done,
    });

    return (
        <SchemasList>
            {schemas.schemaIds.map((schemaId) => {
                const schema = schemas.schemaResultById[schemaId];
                const schemaSortOrder =
                    schemas.schemaSortByIds[schemaId] ??
                    defaultSortSchemaTableBy;
                return (
                    <SchemaTableItem
                        key={schema.name}
                        name={schema.name}
                        total={schema.count}
                        tables={schema.tables}
                        sortOrder={schemaSortOrder}
                        selectedTableId={selectedTableId}
                        tableRowRenderer={tableRowRenderer}
                        onSortChanged={(
                            sortKey?: SchemaTableSortKey | null,
                            sortAsc?: boolean | null
                        ) =>
                            dispatch(
                                changeTableSort(schema.id, sortKey, sortAsc)
                            )
                        }
                        onLoadMore={() =>
                            dispatch(
                                searchTableBySchema(schema.name, schema.id)
                            )
                        }
                    />
                );
            })}

            <IntersectionElement ref={setIntersectElement} />
        </SchemasList>
    );
};

import React, { useRef } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import type { ITableSearchResult } from 'redux/dataTableSearch/types';
import { useIntersectionObserver } from 'hooks/useIntersectionObserver';

import {
    searchSchemas,
    searchTableBySchema,
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

function prepareSchemaNames(
    tables: ITableSearchResult[],
    selectedTableId: number
): ITableSearchResult[] {
    if (!tables) {
        return [];
    }

    return tables.map((table) => ({
        ...table,
        selected: table.id === selectedTableId,
        full_name: table.name,
    }));
}

export const SchemaTableView: React.FunctionComponent<{
    tableRowRenderer: (table: ITableSearchResult) => React.ReactNode;
    selectedTableId: number;
}> = ({ tableRowRenderer, selectedTableId }) => {
    const schemas = useSelector(
        (state: IStoreState) => state.dataTableSearch.schemas
    );
    const dispatch: Dispatch = useDispatch();
    const schemasListRef = useRef<HTMLDivElement>(null);
    const intersectionElementRef = useRef<HTMLDivElement>(null);

    useIntersectionObserver({
        rootElement: schemasListRef.current,
        intersectElement: intersectionElementRef.current,
        onIntersect: () => {
            dispatch(searchSchemas());
        },
        listData: schemas,
    });

    return (
        <SchemasList ref={schemasListRef}>
            {schemas.schemaIds.map((schemaId) => {
                const schema = schemas.schemaResultById[schemaId];
                return (
                    <SchemaTableItem
                        key={schema.name}
                        name={schema.name}
                        total={schema?.count}
                        data={prepareSchemaNames(schema?.tables, selectedTableId)}
                        tableRowRenderer={tableRowRenderer}
                        onLoadMore={() =>
                            dispatch(
                                searchTableBySchema(schema.name, schema.id)
                            )
                        }
                    />
                );
            })}

            <IntersectionElement ref={intersectionElementRef} />
        </SchemasList>
    );
};

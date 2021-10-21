import React, { useRef } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import type { ITableSearchResult } from 'redux/dataTableSearch/types';
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
    const intersectionElementRef = useRef<HTMLDivElement>(null);

    useIntersectionObserver({
        intersectElement: intersectionElementRef.current,
        onIntersect: () => {
            dispatch(searchSchemas());
        },
        deps: [schemas.schemaIds],
        enabled: schemas.done,
    });

    return (
        <SchemasList>
            {schemas.schemaIds.map((schemaId) => {
                const schema = schemas.schemaResultById[schemaId];
                return (
                    <SchemaTableItem
                        key={schema.name}
                        name={schema.name}
                        total={schema?.count}
                        tables={schema?.tables}
                        selectedTableId={selectedTableId}
                        tableRowRenderer={tableRowRenderer}
                        onSortChanged={(value: boolean) =>
                            dispatch(changeTableSort(schema.id, value))
                        }
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

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import type { ITableSearchResult } from 'redux/dataTableSearch/types';

import {
    searchSchemas,
    searchTableBySchema,
} from 'redux/dataTableSearch/action';
import { SchemaTableItem } from './Item';

const CategoriesList = styled.div`
    height: 50vh;
    overflow-y: auto;
`;

const IntersectionElement = styled.div`
    width: 100%;
    height: 1px;
`;

function prepareSchemaNames(
    tables: ITableSearchResult[]
): ITableSearchResult[] {
    if (!tables) {
        return [];
    }

    return tables.map((table) => ({
        ...table,
        full_name: table.full_name.split('.').slice(1).join('.'),
    }));
}

export const SchemaTableView: React.FunctionComponent<{
    tableRowRenderer: (item: any) => React.ReactNode;
}> = ({ tableRowRenderer }) => {
    const schemas = useSelector(
        (state: IStoreState) => state.dataTableSearch.schemas
    );
    const dispatch: Dispatch = useDispatch();
    const categoriesList = useRef<HTMLDivElement>(null);
    const lastElement = useRef<HTMLDivElement>(null);
    const interseptor = useRef<IntersectionObserver>(null);

    useEffect(() => {
        dispatch(searchSchemas());
    }, []);

    useEffect(() => {
        interseptor.current = new IntersectionObserver(
            (entries, observer) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    observer.unobserve(lastElement.current);
                    dispatch(searchSchemas());
                }
            },
            {
                root: categoriesList.current,
            }
        );
    }, [lastElement]);

    useEffect(() => {
        if (schemas.count && schemas.list.length < schemas.count) {
            interseptor.current.observe(lastElement.current);
        }
    }, [schemas]);

    return (
        <CategoriesList ref={categoriesList}>
            {schemas.list.map((category) => {
                return (
                    <SchemaTableItem
                        name={category.name}
                        total={schemas.count}
                        data={prepareSchemaNames(
                            schemas.list.find((s) => s.id === category.id)?.tables
                        )}
                        tableRowRenderer={tableRowRenderer}
                        onLoadMore={() =>
                            dispatch(
                                searchTableBySchema(category.name, category.id)
                            )
                        }
                    />
                );
            })}

            <IntersectionElement ref={lastElement}></IntersectionElement>
        </CategoriesList>
    );
};

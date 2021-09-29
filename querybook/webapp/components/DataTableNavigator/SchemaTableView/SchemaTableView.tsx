import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux/store/types';

import {
    searchSchemas,
    searchTableBySchema,
} from 'redux/dataTableSearch/action';
import Item from './Item';

const CategoriesList = styled.div`
    height: 50vh;
    overflow-y: auto;
`;

const IntersectionElement = styled.div`
    width: 100%;
    height: 1px;
`;

export const SchemaTableView: React.FunctionComponent<{
    tableRowRenderer: Function;
}> = ({ tableRowRenderer }) => {
    const schemas = useSelector((state) => state.dataTableSearch.schemas);
    const dispatch: Dispatch = useDispatch();
    const categoriesList = useRef(null);
    const lastElem = useRef(null);
    const interseptor = useRef(null);

    useEffect(() => {
        dispatch(searchSchemas());
    }, []);

    useEffect(() => {
        interseptor.current = new IntersectionObserver(
            (entries, observer) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    observer.unobserve(lastElem.current);
                    dispatch(searchSchemas());
                }
            },
            {
                root: categoriesList.current,
            }
        );
    }, [lastElem]);

    useEffect(() => {
        if (schemas.count && schemas.list.length < schemas.count) {
            interseptor.current.observe(lastElem.current);
        }
    }, [schemas]);

    return (
        <CategoriesList ref={categoriesList}>
            {schemas.list.map((category) => {
                return (
                    <Item
                        name={category.name}
                        total={category.table_count}
                        data={
                            schemas.list.find((s) => s.id === category.id)
                                ?.tables || []
                        }
                        tableRowRenderer={tableRowRenderer}
                        onLoadMore={() => {
                            dispatch(
                                searchTableBySchema(category.name, category.id)
                            );
                        }}
                    />
                );
            })}

            <IntersectionElement ref={lastElem}></IntersectionElement>
        </CategoriesList>
    );
};

import React from 'react';
import { findSearchEntities } from 'lib/data-doc/search';
import { IDataDocSearchOptions } from 'const/datadoc';

export function makeSearchHighlightDecorator(
    searchString: string,
    searchOptions: IDataDocSearchOptions
) {
    return {
        strategy: findSearchEntities(searchString, searchOptions),
        component: SearchHighlight,
    };
}

const SearchHighlight: React.FC = ({ children }) => {
    return <span className="search-highlight">{children}</span>;
};

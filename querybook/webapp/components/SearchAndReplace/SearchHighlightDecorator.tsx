import React from 'react';

import { ISearchOptions } from 'const/searchAndReplace';
import { findSearchEntities } from 'lib/data-doc/search';

export function makeSearchHighlightDecorator(
    searchString: string,
    searchOptions: ISearchOptions
) {
    return {
        strategy: findSearchEntities(searchString, searchOptions),
        component: SearchHighlight,
    };
}

const SearchHighlight: React.FC = ({ children }) => (
    <span className="search-highlight">{children}</span>
);

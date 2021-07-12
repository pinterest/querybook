import React from 'react';
import { ISearchAndReplaceState } from 'const/searchAndReplace';

export interface ISearchAndReplaceContextType {
    searchState: ISearchAndReplaceState;
    focusSearchBar: () => any;
    showSearchAndReplace: () => any;
    hideSearchAndReplace: () => any;
}

export const SearchAndReplaceContext = React.createContext<ISearchAndReplaceContextType>(
    null
);

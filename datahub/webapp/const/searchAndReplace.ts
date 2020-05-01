export interface ISearchResult {
    cellId?: number;
    blockKey?: string;
    from: number;
    to: number;
}

export interface ISearchOptions {
    matchCase: boolean;
    useRegex: boolean;
}

export interface ISearchAndReplaceState {
    searchString: string;
    searchOptions: ISearchOptions;
    replaceString: string;
    searchResults: ISearchResult[];
    currentSearchResultIndex: number;
}

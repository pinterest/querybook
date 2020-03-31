import { ThunkDispatch } from 'redux-thunk';

import { IUserState, UserAction } from 'redux/user/types';
import { IDataDocState, DataDocAction } from 'redux/dataDoc/types';
import { ISearchState, SearchAction } from 'redux/search/types';
import { IDataSourcesState, DataSourcesAction } from 'redux/dataSources/types';
import {
    IDataTableSearchState,
    DataTableSearchAction,
} from 'redux/dataTableSearch/types';
import {
    IQueryExecutionState,
    QueryExecutionAction,
} from 'redux/queryExecutions/types';
import {
    IQuerySnippetsState,
    QuerySnippetsAction,
} from 'redux/querySnippets/types';
import { IQueryViewState, QueryViewAction } from 'redux/queryView/types';
import { DataHubUIAction, IDataHubUIState } from 'redux/dataHubUI/types';
import { IQueryEngineState, QueryEngineAction } from 'redux/queryEngine/types';
import { IEnvironmentState, EnvironmentAction } from 'redux/environment/types';
import { IAdhocQueryState, AdhocQueryAction } from 'redux/adhocQuery/types';
import { IBoardState, BoardAction } from 'redux/board/types';

export interface IStoreState {
    readonly user: IUserState;
    readonly dataDoc: IDataDocState;
    readonly search: ISearchState;
    readonly dataSources: IDataSourcesState;
    readonly dataTableSearch: IDataTableSearchState;
    readonly queryExecutions: IQueryExecutionState;
    readonly querySnippets: IQuerySnippetsState;
    readonly queryView: IQueryViewState;
    readonly queryEngine: IQueryEngineState;
    readonly dataHubUI: IDataHubUIState;
    readonly environment: IEnvironmentState;
    readonly adhocQuery: IAdhocQueryState;
    readonly board: IBoardState;
}

export type AllAction =
    | UserAction
    | DataDocAction
    | SearchAction
    | DataSourcesAction
    | DataTableSearchAction
    | QueryExecutionAction
    | QuerySnippetsAction
    | QueryEngineAction
    | QueryViewAction
    | DataHubUIAction
    | EnvironmentAction
    | AdhocQueryAction
    | BoardAction;

export type Dispatch = ThunkDispatch<IStoreState, null, AllAction>;

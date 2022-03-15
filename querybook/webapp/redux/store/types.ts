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
import { QuerybookUIAction, IQuerybookUIState } from 'redux/querybookUI/types';
import { IQueryEngineState, QueryEngineAction } from 'redux/queryEngine/types';
import { IEnvironmentState, EnvironmentAction } from 'redux/environment/types';
import { AdhocQueryState, AdhocQueryAction } from 'redux/adhocQuery/types';
import { IBoardState, BoardAction } from 'redux/board/types';
import { IGlobalStateState, GlobalStateAction } from 'redux/globalState/types';
import {
    INotificationState,
    NotificationServiceAction,
} from 'redux/notificationService/types';
import { ITagState, TagAction } from 'redux/tag/types';
import {
    IScheduledDataDocState,
    IReceiveDataWithSchemaAction,
} from 'redux/scheduledDataDoc/types';

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
    readonly notificationService: INotificationState;
    readonly querybookUI: IQuerybookUIState;
    readonly environment: IEnvironmentState;
    readonly adhocQuery: AdhocQueryState;
    readonly board: IBoardState;
    readonly globalState: IGlobalStateState;
    readonly tag: ITagState;
    readonly scheduledDocs: IScheduledDataDocState;
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
    | QuerybookUIAction
    | EnvironmentAction
    | NotificationServiceAction
    | AdhocQueryAction
    | BoardAction
    | GlobalStateAction
    | TagAction
    | IReceiveDataWithSchemaAction;

export type Dispatch = ThunkDispatch<IStoreState, null, AllAction>;

import { ThunkDispatch } from 'redux-thunk';

import { AdhocQueryAction, AdhocQueryState } from 'redux/adhocQuery/types';
import { BoardAction, IBoardState } from 'redux/board/types';
import { DataDocAction, IDataDocState } from 'redux/dataDoc/types';
import { DataSourcesAction, IDataSourcesState } from 'redux/dataSources/types';
import {
    DataTableSearchAction,
    IDataTableSearchState,
} from 'redux/dataTableSearch/types';
import { EnvironmentAction, IEnvironmentState } from 'redux/environment/types';
import { GlobalStateAction, IGlobalStateState } from 'redux/globalState/types';
import {
    INotificationState,
    NotificationServiceAction,
} from 'redux/notificationService/types';
import { IQuerybookUIState, QuerybookUIAction } from 'redux/querybookUI/types';
import { IQueryEngineState, QueryEngineAction } from 'redux/queryEngine/types';
import {
    IQueryExecutionState,
    QueryExecutionAction,
} from 'redux/queryExecutions/types';
import {
    IQuerySnippetsState,
    QuerySnippetsAction,
} from 'redux/querySnippets/types';
import { IQueryViewState, QueryViewAction } from 'redux/queryView/types';
import {
    IScheduledDataDocState,
    ScheduledDataDocAction,
} from 'redux/scheduledDataDoc/types';
import { ISearchState, SearchAction } from 'redux/search/types';
import { ITagState, TagAction } from 'redux/tag/types';
import { IUserState, UserAction } from 'redux/user/types';

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
    | ScheduledDataDocAction;

export type Dispatch = ThunkDispatch<IStoreState, null, AllAction>;

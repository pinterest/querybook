import { bind } from 'lodash-decorators';
import React from 'react';
import { connect } from 'react-redux';

import * as querySnippetsActions from 'redux/querySnippets/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IQuerySnippet } from 'redux/querySnippets/types';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';

import { Tabs } from 'ui/Tabs/Tabs';
import { Loading } from 'ui/Loading/Loading';
import { Sidebar } from 'ui/Sidebar/Sidebar';
import { Title } from 'ui/Title/Title';
import { QuerySnippetNavigator } from 'components/QuerySnippetNavigator/QuerySnippetNavigator';

import { QuerySnippetView } from './QuerySnippetView';
import './QuerySnippetInsertionModal.scss';
import { QuerySnippetComposer } from 'components/QuerySnippetComposer/QuerySnippetComposer';

interface IOwnProps {
    onInsert: (query: string) => any;
    onDismiss: () => any;
}
type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

type IQuerySnippetInsertionModalProps = IOwnProps & StateProps & DispatchProps;

interface IQuerySnippetInsertionModalState {
    snippetId?: number;
    loadingSnippet: boolean;
    editSnippetMode: boolean;
}

const SNIPPET_MODES = ['Insert', 'Edit'];

class QuerySnippetInsertionModalComponent extends React.PureComponent<
    IQuerySnippetInsertionModalProps,
    IQuerySnippetInsertionModalState
> {
    public readonly state = {
        snippetId: null,
        loadingSnippet: false,
        editSnippetMode: false,
    };

    @bind
    public fetchQuerySnippet(id: number) {
        if (id) {
            this.setState(
                {
                    loadingSnippet: true,
                    snippetId: id,
                },
                async () => {
                    await this.props.fetchQuerySnippetIfNeeded(id);
                    this.setState({
                        loadingSnippet: false,
                    });
                }
            );
        }
    }

    @bind
    public onQuerySnippetSelect(item: IQuerySnippet) {
        this.fetchQuerySnippet(item.id);
    }

    @bind
    public onInsertSnippet(query: string) {
        const { onInsert, onDismiss } = this.props;

        if (onInsert) {
            onInsert(query);
        }

        onDismiss();
    }

    @bind
    public handleUpdateEditMode(tab: string) {
        this.setState({
            editSnippetMode: tab === SNIPPET_MODES[1],
        });
    }

    public render() {
        const { querySnippetById, queryEngineById } = this.props;

        const { snippetId, loadingSnippet, editSnippetMode } = this.state;

        let querySnippetViewDOM;
        if (snippetId) {
            const querySnippet = querySnippetById[snippetId];

            if (!loadingSnippet && querySnippet && querySnippet.context) {
                if (editSnippetMode) {
                    querySnippetViewDOM = (
                        <QuerySnippetComposer querySnippet={querySnippet} />
                    );
                } else {
                    querySnippetViewDOM = (
                        <QuerySnippetView
                            key={snippetId}
                            querySnippet={querySnippet}
                            onInsert={this.onInsertSnippet}
                            queryEngineById={queryEngineById}
                        />
                    );
                }
            } else {
                querySnippetViewDOM = <Loading />;
            }
        } else {
            querySnippetViewDOM = (
                <div className="empty-message">
                    Choose a template on the left.
                </div>
            );
        }

        return (
            <div className={'QuerySnippetInsertionModal '}>
                <div className="query-snippet-insertion-header horizontal-space-between">
                    <div>
                        <Title size={3}>Query Template</Title>
                    </div>
                    <div>
                        <Tabs
                            pills
                            items={SNIPPET_MODES}
                            selectedTabKey={
                                editSnippetMode
                                    ? SNIPPET_MODES[1]
                                    : SNIPPET_MODES[0]
                            }
                            onSelect={this.handleUpdateEditMode}
                        />
                    </div>
                </div>
                <div className="query-snippet-insertion-content">
                    <Sidebar key={'navigator'} initialWidth={400} left>
                        <div className="query-snippet-navigator-wrapper">
                            <QuerySnippetNavigator
                                onQuerySnippetSelect={this.onQuerySnippetSelect}
                            />
                        </div>
                    </Sidebar>
                    <div className="query-snippet-view-wrapper">
                        {querySnippetViewDOM}
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: IStoreState) => ({
    querySnippetById: state.querySnippets.querySnippetById,
    queryEngineById: queryEngineByIdEnvSelector(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    fetchQuerySnippetIfNeeded: (id: number) =>
        dispatch(querySnippetsActions.fetchQuerySnippetIfNeeded(id)),
});

export const QuerySnippetInsertionModal = connect(
    mapStateToProps,
    mapDispatchToProps
)(QuerySnippetInsertionModalComponent);

import { bind } from 'lodash-decorators';
import React from 'react';
import { connect } from 'react-redux';

import { QuerySnippetComposer } from 'components/QuerySnippetComposer/QuerySnippetComposer';
import { QuerySnippetNavigator } from 'components/QuerySnippetNavigator/QuerySnippetNavigator';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import * as querySnippetsActions from 'redux/querySnippets/action';
import { IQuerySnippet } from 'redux/querySnippets/types';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Loading } from 'ui/Loading/Loading';
import { Modal } from 'ui/Modal/Modal';
import { Sidebar } from 'ui/Sidebar/Sidebar';
import { EmptyText } from 'ui/StyledText/StyledText';
import { Tabs } from 'ui/Tabs/Tabs';

import { QuerySnippetView } from './QuerySnippetView';

import './QuerySnippetInsertionModal.scss';

interface IOwnProps {
    onInsert: (query: string) => any;
    onHide: () => void;
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
        const { onInsert } = this.props;

        if (onInsert) {
            onInsert(query);
        }
    }

    @bind
    public handleUpdateEditMode(tab: string) {
        this.setState({
            editSnippetMode: tab === SNIPPET_MODES[1],
        });
    }

    public render() {
        const { querySnippetById, queryEngineById, onHide } = this.props;

        const { snippetId, loadingSnippet, editSnippetMode } = this.state;

        const modeToggleDOM = (
            <Tabs
                pills
                items={SNIPPET_MODES}
                selectedTabKey={
                    editSnippetMode ? SNIPPET_MODES[1] : SNIPPET_MODES[0]
                }
                onSelect={this.handleUpdateEditMode}
            />
        );

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
                <EmptyText className="mt24">
                    Choose a snippet on the left.
                </EmptyText>
            );
        }

        return (
            <Modal
                onHide={onHide}
                className="wide"
                title="Insert Snippet"
                topDOM={snippetId ? modeToggleDOM : null}
            >
                <div className="QuerySnippetInsertionModal">
                    <div className="query-snippet-insertion-content">
                        <Sidebar key={'navigator'} initialWidth={360} left>
                            <QuerySnippetNavigator
                                onQuerySnippetSelect={this.onQuerySnippetSelect}
                            />
                        </Sidebar>
                        <div className="query-snippet-view-wrapper">
                            {querySnippetViewDOM}
                        </div>
                    </div>
                </div>
            </Modal>
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

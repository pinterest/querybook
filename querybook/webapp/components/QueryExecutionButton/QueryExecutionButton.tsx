import { decorate } from 'core-decorators';
import { bind } from 'lodash-decorators';
import memoizeOne from 'memoize-one';
import React from 'react';
import { connect } from 'react-redux';

import { TooltipDirection } from 'const/tooltip';
import { fetchActiveQueryExecutionForUser } from 'redux/queryExecutions/action';
import { IQueryExecution } from 'redux/queryExecutions/types';
import { IStoreState, Dispatch } from 'redux/store/types';
import { Popover, PopoverLayout } from 'ui/Popover/Popover';
import { Modal } from 'ui/Modal/Modal';
import { QueryViewNavigator } from 'components/QueryViewNavigator/QueryViewNavigator';
import { QueryView } from 'components/QueryView/QueryView';
import { QueryExecutionStatus } from 'const/queryExecution';
import { IconButton } from 'ui/Button/IconButton';

import './QueryExecutionButton.scss';

interface IOwnProps {
    tooltipPos?: TooltipDirection;
    popoverLayout?: PopoverLayout;

    onClick?: () => any;
    active?: boolean;
}
type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type IProps = StateProps & DispatchProps & IOwnProps;

interface IState {
    showQueryViewModalForId?: number;
    hidePanel: boolean;
    hasInitialLoadFinished: boolean;
}

class QueryExecutionButtonComponent extends React.PureComponent<
    IProps,
    IState
> {
    public readonly state = {
        hasInitialLoadFinished: false,
        showQueryViewModalForId: null,
        hidePanel: true,
    };
    private buttonRef = React.createRef<HTMLAnchorElement>();
    private mounted = false;

    // Extract this into a selector
    @decorate(memoizeOne)
    public _getActiveQueryExecutions(
        queryExecutionById: Record<number, IQueryExecution>,
        queryEnginesInEnv: number[]
    ) {
        return Object.values(queryExecutionById).filter(
            (queryExecution) =>
                // filter by query executions only in the current environment
                queryEnginesInEnv.includes(queryExecution.engine_id) &&
                queryExecution.status < QueryExecutionStatus.DONE
        );
    }

    @bind
    public getActiveQueryExecutions() {
        const { queryExecutionById, queryEnginesInEnv } = this.props;

        return this._getActiveQueryExecutions(
            queryExecutionById,
            queryEnginesInEnv
        );
    }

    @bind
    public togglePanel() {
        this.setState({ hidePanel: !this.state.hidePanel });
    }

    @bind
    public onQueryExecutionClick(queryExecution: IQueryExecution) {
        this.setState({
            showQueryViewModalForId: queryExecution.id,
        });
    }

    @bind
    public onQueryViewHide() {
        this.setState({
            showQueryViewModalForId: null,
        });
    }

    public componentDidMount() {
        this.mounted = true;

        this.props.fetchActiveQueryExecutionForUser(this.props.uid).then(() => {
            if (this.mounted) {
                this.setState({
                    hasInitialLoadFinished: true,
                });
            }
        });
    }

    public componentWillUnmount() {
        this.mounted = false;
    }

    public render() {
        const {
            tooltipPos = 'right',
            popoverLayout = ['right', 'bottom'] as PopoverLayout,
            onClick,
            active,
        } = this.props;
        const {
            hidePanel,
            showQueryViewModalForId,
            hasInitialLoadFinished,
        } = this.state;
        const activeQueryExecutions = this.getActiveQueryExecutions();

        const panel = hidePanel ? null : (
            <Popover
                anchor={this.buttonRef.current}
                layout={popoverLayout}
                onHide={this.togglePanel}
                resizeOnChange
            >
                <div className="QueryViewNavigator-wrapper">
                    <QueryViewNavigator
                        onQueryExecutionClick={this.onQueryExecutionClick}
                    />
                </div>
            </Popover>
        );

        const queryViewDOM =
            showQueryViewModalForId != null ? (
                <Modal
                    onHide={this.onQueryViewHide}
                    className="wide with-padding"
                    title="Execution Details"
                >
                    <QueryView queryId={showQueryViewModalForId} />
                </Modal>
            ) : null;

        const buttonTitle = hasInitialLoadFinished
            ? activeQueryExecutions.length > 0
                ? `You have ${activeQueryExecutions.length} running queries.`
                : 'No running queries.'
            : 'Checking running queries';

        return (
            <>
                <span className="QueryExecutionButton">
                    <IconButton
                        onClick={onClick || this.togglePanel}
                        ref={this.buttonRef}
                        tooltip={buttonTitle}
                        tooltipPos={tooltipPos}
                        icon={'list'}
                        active={active || showQueryViewModalForId != null}
                        ping={
                            activeQueryExecutions.length > 0
                                ? activeQueryExecutions.length.toString()
                                : null
                        }
                        title="Runs"
                    />
                </span>
                {panel}
                {queryViewDOM}
            </>
        );
    }
}

function mapStateToProps(state: IStoreState) {
    return {
        queryExecutionById: state.queryExecutions.queryExecutionById,
        uid: state.user.myUserInfo.uid,
        queryEnginesInEnv:
            state.environment.environmentEngineIds[
                state.environment.currentEnvironmentId
            ] ?? [],
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        fetchActiveQueryExecutionForUser: (uid: number) =>
            dispatch(fetchActiveQueryExecutionForUser(uid)),
    };
}

export const QueryExecutionButton = connect(
    mapStateToProps,
    mapDispatchToProps
)(QueryExecutionButtonComponent);

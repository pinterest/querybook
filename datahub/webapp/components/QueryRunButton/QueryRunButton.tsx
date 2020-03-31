import classNames from 'classnames';
import * as React from 'react';

import { IQueryEngine, QueryEngineStatus } from 'const/queryEngine';

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { DropdownMenu } from 'ui/DropdownMenu/DropdownMenu';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';

import './QueryRunButton.scss';
import { useSelector } from 'react-redux';
import { queryEngineStatusByIdEnvSelector } from 'redux/queryEngine/selector';
import { queryEngineStatusToIconStatus } from 'const/queryStatusIcon';

interface IQueryRunButtonProps {
    disabled?: boolean;
    hasSelection?: boolean;

    onRunClick: () => any;

    queryEngineById: Record<number, IQueryEngine>;
    queryEngines: IQueryEngine[];
    engineId: number;
    onEngineIdSelect: (id: number) => any;
}

export interface IRunButtonHandles {
    clickRunButton(): void;
}

export const QueryRunButton = React.forwardRef<
    IRunButtonHandles,
    IQueryRunButtonProps
>(
    (
        {
            disabled,
            hasSelection,
            onRunClick,
            queryEngineById,
            queryEngines,
            engineId,
            onEngineIdSelect,
        },
        ref
    ) => {
        const queryEngineStatusById = useSelector(
            queryEngineStatusByIdEnvSelector
        );

        const runButtonRef = React.useRef<AsyncButton>();

        React.useImperativeHandle(ref, () => ({
            clickRunButton: () => {
                if (runButtonRef.current) {
                    runButtonRef.current.onClick();
                }
            },
        }));

        const getRunButtonDOM = React.useCallback(() => {
            if (disabled) {
                return null;
            }

            return (
                <AsyncButton
                    onClick={onRunClick}
                    ref={runButtonRef}
                    className={classNames({
                        'run-selection': !!hasSelection,
                    })}
                    title={hasSelection ? 'Run Selection' : null}
                    icon={hasSelection ? null : 'play'}
                    aria-label={'Execute (⇧↵)'}
                    data-balloon-pos={'up'}
                    attachedRight
                />
            );
        }, [disabled, onRunClick, runButtonRef, hasSelection]);

        const getEngineSelectorButtonDOM = React.useCallback(() => {
            const engineStatus = queryEngineStatusById[engineId];
            const warningLevel =
                engineStatus?.data?.status ?? QueryEngineStatus.UNAVAILABLE;
            const iconClass = queryEngineStatusToIconStatus[warningLevel];

            const queryEngineName =
                engineId in queryEngineById
                    ? queryEngineById[engineId].name
                    : null;

            return (
                <div className="engine-selector-button flex-row">
                    <StatusIcon status={iconClass} />{' '}
                    <span>
                        {queryEngineName}{' '}
                        <i className="fa fa-caret-down caret-icon" />
                    </span>
                </div>
            );
        }, [queryEngineStatusById, queryEngineById, engineId]);

        const getEngineSelectorDOM = React.useCallback(() => {
            let engineButton = null;
            if (!disabled) {
                const engineItems = queryEngines.map((engineInfo) => {
                    return {
                        name: (
                            <span className="query-engine-name">
                                {engineInfo.name}
                            </span>
                        ),
                        onClick: onEngineIdSelect.bind(null, engineInfo.id),
                        checked: engineInfo.id === engineId,
                        tooltip: engineInfo.description,
                    };
                });
                engineButton = (
                    <DropdownMenu
                        customButtonRenderer={getEngineSelectorButtonDOM}
                        items={engineItems}
                        type="select"
                        className="is-right"
                    />
                );
            } else {
                engineButton = queryEngineById[engineId].name;
            }

            return (
                <div
                    className={classNames({
                        'engine-selector': true,
                        readonly: disabled,
                    })}
                >
                    {engineButton}
                </div>
            );
        }, [
            disabled,
            queryEngines,
            onEngineIdSelect,
            getEngineSelectorButtonDOM,
            queryEngineById,
            engineId,
        ]);

        return (
            <div className="QueryRunButton flex-row">
                {getRunButtonDOM()}
                {getEngineSelectorDOM()}
            </div>
        );
    }
);

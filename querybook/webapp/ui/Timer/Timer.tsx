import { bind } from 'lodash-decorators';
import React from 'react';
import clsx from 'clsx';

export interface ITimerProps<T> {
    formatter?: (ts: T) => React.ReactChild;
    updater?: (ts: T) => T;

    updateFrequency?: number;
    initialValue?: T;
    className?: string;
}

interface ITimerState<T> {
    value: T;
}

export class Timer<T = number> extends React.PureComponent<
    ITimerProps<T>,
    ITimerState<T>
> {
    public static defaultProps = {
        formatter: (timestamp: number) => timestamp,
        updater: (timestamp: number) => timestamp + 1,

        updateFrequency: 1000, // 1 second
        className: '',
        initialValue: 0,
    };

    private updateInterval: number = null;

    public constructor(props: ITimerProps<T>) {
        super(props);

        this.state = {
            value: this.props.initialValue,
        };
    }

    @bind
    public updateTimer(overrideValue = null) {
        this.setState(({ value }) => ({
            value:
                overrideValue != null
                    ? this.props.updater(overrideValue)
                    : this.props.updater(value),
        }));
    }

    public componentDidMount() {
        this.updateInterval = setInterval(
            this.updateTimer,
            this.props.updateFrequency
        );
    }

    public componentWillUnmount() {
        clearInterval(this.updateInterval);
    }

    public render() {
        const { formatter, className } = this.props;

        const { value } = this.state;

        const spanClassNames = clsx({
            Timer: true,
            [className]: Boolean(className),
        });
        return <span className={spanClassNames}>{formatter(value)}</span>;
    }
}

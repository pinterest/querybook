import {
    ButtonProps,
    ButtonType,
    getButtonComponentByType,
} from '../Button/Button';
import React from 'react';
import clsx from 'clsx';

export interface IAsyncButtonProps extends ButtonProps {
    onClick: (...args: any[]) => Promise<unknown>;
    disableWhileAsync?: boolean;
    type?: ButtonType;
}

export interface IAsyncButtonState {
    loading?: boolean;
}

export class AsyncButton extends React.PureComponent<
    IAsyncButtonProps,
    IAsyncButtonState
> {
    public static defaultProps: Partial<IAsyncButtonProps> = {
        disableWhileAsync: true,
    };
    private canSetState: boolean = true;

    public constructor(props: IAsyncButtonProps) {
        super(props);

        this.state = {
            loading: false,
        };
    }

    public componentWillUnmount() {
        this.canSetState = false;
    }

    public asyncSetState(newState: Partial<IAsyncButtonState>) {
        return new Promise<void>((resolve) => {
            if (this.canSetState) {
                this.setState(newState, resolve);
            }
        });
    }

    public onClick = async (...args: any[]) => {
        const { disableWhileAsync } = this.props;
        const { loading } = this.state;
        if (!(loading && disableWhileAsync)) {
            await this.asyncSetState({ loading: true });
            try {
                await this.props.onClick(...args);
            } finally {
                await this.asyncSetState({ loading: false });
            }
        }
    };

    public render() {
        const { disableWhileAsync, type, ...propsForButton } = this.props;
        const { loading } = this.state;

        const buttonProps: ButtonProps = {
            ...propsForButton,

            onClick: this.onClick,
            isLoading: loading,
            className: clsx({
                [propsForButton.className || '']: true,
            }),
        };
        const Button = getButtonComponentByType(type);
        return <Button {...buttonProps}>{this.props.children}</Button>;
    }
}

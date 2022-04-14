import {
    ButtonProps,
    ButtonType,
    getButtonComponentByType,
} from '../Button/Button';
import React, {
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import clsx from 'clsx';

export interface IAsyncButtonProps extends ButtonProps {
    onClick?: (...args: any[]) => Promise<unknown>;
    disableWhileAsync?: boolean;
    type?: ButtonType;
}

export interface IAsyncButtonHandles {
    onClick: () => Promise<void>;
}

function useSafeState<T>(initialValue: T | (() => T)) {
    const canSetStateRef = useRef(true);
    useEffect(() => {
        canSetStateRef.current = true;
        return () => {
            canSetStateRef.current = false;
        };
    }, []);

    const [state, setState] = useState(initialValue);

    /**
     * setState would throw an error if the component is
     * not mounted, so
     */
    const safeSetState = useCallback((newValue: T) => {
        if (canSetStateRef.current) {
            setState(newValue);
        }
    }, []);

    return [state, safeSetState] as const;
}

export const AsyncButton = React.forwardRef<
    IAsyncButtonHandles,
    IAsyncButtonProps
>(
    (
        {
            disableWhileAsync = true,
            onClick,
            type,
            children,
            ...propsForButton
        },
        ref
    ) => {
        const [loading, setLoading] = useSafeState(false);

        const handleAsyncClick = useCallback(
            async (...args: any[]) => {
                setLoading(true);
                try {
                    await onClick?.(...args);
                } finally {
                    setLoading(false);
                }
            },
            [onClick]
        );

        useImperativeHandle(
            ref,
            () => ({
                onClick: handleAsyncClick,
            }),
            [handleAsyncClick]
        );

        const buttonProps: ButtonProps = {
            isLoading: loading,
            onClick: handleAsyncClick,
            ...propsForButton,

            disabled:
                (disableWhileAsync && loading) ||
                Boolean(propsForButton.disabled),
            className: clsx(propsForButton.className || ''),
        };
        const Button = getButtonComponentByType(type);
        return <Button {...buttonProps}>{children}</Button>;
    }
);

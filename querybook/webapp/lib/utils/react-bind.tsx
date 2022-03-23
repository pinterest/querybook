import React from 'react';

export function withBoundProps<B extends Partial<P>, P>(
    Component: React.ComponentType<P>,
    boundProps: B,
    displayName = ''
) {
    const boundComponent = React.forwardRef<HTMLElement, P>((props, ref) => {
        const mergedProps = { ...boundProps, ...props, ref };
        return <Component {...mergedProps} />;
    });

    if (displayName) {
        boundComponent.displayName = displayName;
    } else if (Component.displayName) {
        boundComponent.displayName = Component.displayName;
    }

    return boundComponent;
}

export function GroupSetProps<Props>({
    children,
    ...otherProps
}: Partial<Props & { children: React.ReactNode }>) {
    const mergedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, otherProps);
        } else {
            return child;
        }
    });
    return <>{mergedChildren}</>;
}

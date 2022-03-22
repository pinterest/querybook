import React from 'react';

import { AccentText, IStyledTextProps } from 'ui/StyledText/StyledText';

export const Title: React.FunctionComponent<IStyledTextProps> = ({
    children,
    ...elementProps
}) => (
    <AccentText size="xlarge" weight="bold" color="text" {...elementProps}>
        {children}
    </AccentText>
);

export const Subtitle: React.FunctionComponent<IStyledTextProps> = ({
    children,
    ...elementProps
}) => (
    <AccentText size="med" color="light" {...elementProps}>
        {children}
    </AccentText>
);

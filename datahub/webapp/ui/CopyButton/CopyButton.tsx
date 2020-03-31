import classNames from 'classnames';
import React from 'react';
import * as Utils from 'lib/utils';
import { Button, IButtonProps } from 'ui/Button/Button';

const DEFAULT_TOOL_TIP = 'Click To Copy.';
const DEFAULT_COPIED_TOOL_TIP = 'Copied!';

interface ICopyButtonProps extends IButtonProps {
    copyText: string;
    icon?: string;
    title?: string;
    className?: string;
}

interface IState {
    tooltip: string;
}

export const CopyButton: React.FunctionComponent<ICopyButtonProps> = ({
    copyText,
    className = '',
    ...propsForButton
}) => {
    const [tooltip, setTooltip] = React.useState(DEFAULT_TOOL_TIP);

    return (
        <Button
            className={classNames({
                CopyButton: true,
                [className]: className,
            })}
            aria-label={tooltip}
            data-balloon-pos={'up'}
            onClick={() => {
                Utils.copy(copyText);
                setTooltip(DEFAULT_COPIED_TOOL_TIP);
            }}
            onMouseLeave={() => setTooltip(DEFAULT_TOOL_TIP)}
            icon="copy"
            {...propsForButton}
        />
    );
};

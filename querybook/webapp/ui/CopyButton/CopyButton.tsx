import clsx from 'clsx';
import React from 'react';

import { TooltipDirection } from 'const/tooltip';
import * as Utils from 'lib/utils';
import {
    ButtonProps,
    ButtonType,
    getButtonComponentByType,
} from 'ui/Button/Button';

const DEFAULT_TOOL_TIP = 'Click To Copy';
const DEFAULT_COPIED_TOOL_TIP = 'Copied!';

export interface ICopyButtonProps extends ButtonProps {
    copyText: string | (() => string);
    icon?: string;
    title?: string;
    className?: string;

    tooltip?: string;
    copiedTooltip?: string;
    tooltipDirection?: TooltipDirection;
    type?: ButtonType;
}

export const CopyButton: React.FunctionComponent<ICopyButtonProps> = ({
    copyText,
    className = '',
    tooltip = DEFAULT_TOOL_TIP,
    copiedTooltip = DEFAULT_COPIED_TOOL_TIP,
    tooltipDirection = 'up',
    type,
    ...propsForButton
}) => {
    const [tooltipToShow, setTooltipToShow] = React.useState(tooltip);

    const Button = getButtonComponentByType(type);
    return (
        <Button
            className={clsx({
                CopyButton: true,
                [className]: className,
            })}
            aria-label={tooltipToShow}
            data-balloon-pos={tooltipDirection}
            onClick={() => {
                Utils.copy(
                    typeof copyText === 'function' ? copyText() : copyText
                );
                setTooltipToShow(copiedTooltip);
            }}
            onMouseLeave={() => setTooltipToShow(tooltip)}
            icon="copy"
            {...propsForButton}
        />
    );
};

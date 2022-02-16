import React from 'react';
import feather, { FeatherAttributes } from 'feather-icons';

import './Icon.scss';

// Wrapper for feather icon
export interface IIconProps {
    className?: string;
    size?: string | number;
    name: string;
    options?: FeatherAttributes;
    fill?: boolean;
    color?: TButtonColors;
}

export type TButtonColors = 'accent' | 'true' | 'false' | 'warning' | 'light';

export const Icon: React.FunctionComponent<IIconProps> = React.memo(
    ({
        name,
        className = '',
        size,
        options = {},
        fill = false,
        color = '',
    }) => {
        if (!(name in feather.icons)) {
            return null;
        }
        if (size != null) {
            options.width = size;
            options.height = size;
        }

        const rawSvg = feather.icons[name].toSvg(options);

        return (
            <span
                className={`${className} Icon ${fill ? 'fill' : ''} ${color}`}
                dangerouslySetInnerHTML={{ __html: rawSvg }}
            />
        );
    }
);

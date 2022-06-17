import centered from '@storybook/addon-centered/react';
import React from 'react';

import { KeyboardKey } from './KeyboardKey';

export const _KeyboardKey = () => (
    <div>
        <KeyboardKey value="esc" />
        <div className="mt16">
            <KeyboardKey value="⌘" />
            <span className="pr4">+</span>
            <KeyboardKey value="K" className="mr4" />
        </div>
        <div className="mt16">
            <KeyboardKey value="Alt" />
            <span className="pr4">+</span>
            <KeyboardKey value="F4" className="mr4" />
        </div>
    </div>
);

export default {
    title: 'Stateless/KeyboardKey',
    decorators: [centered],
};

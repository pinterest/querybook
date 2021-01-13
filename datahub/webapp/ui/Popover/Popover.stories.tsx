import React, { useRef, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Popover } from './Popover';

export const _Popover = (args) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [show, setShow] = useState(false);

    return (
        <>
            <div
                ref={divRef}
                style={{
                    border: '1px solid black',
                    cursor: 'pointer',
                    padding: '20px 10px',
                }}
                onClick={() => setShow((v) => !v)}
            >
                Click me!
            </div>
            {show ? (
                <Popover
                    onHide={() => setShow(false)}
                    anchor={divRef.current}
                    hideArrow={args.hideArrow}
                    layout={[args.mainDirection, args.secondaryDirection]}
                    skipAnimation={args.skipAnimation}
                >
                    <div className="p12">I am content inside popover!</div>
                </Popover>
            ) : null}
        </>
    );
};

_Popover.args = {
    hideArrow: false,
    mainDirection: 'left',
    secondaryDirection: 'top',
    skipAnimation: false,
};

const directions = ['left', 'right', 'top', 'bottom'];
_Popover.argTypes = {
    mainDirection: {
        control: {
            type: 'select',
            options: directions,
        },
    },
    secondaryDirection: {
        control: {
            type: 'select',
            options: directions,
        },
    },
};

export default {
    title: 'Stateless/Popover',
    decorators: [centered],
};

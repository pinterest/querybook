import * as React from 'react';

import { KeyboardKey } from 'ui/KeyboardKey/KeyboardKey';
import { Title } from 'ui/Title/Title';

import './Shortcut.scss';

const shortcuts: Array<{
    title: string;
    keys: Array<[string[], string]>;
}> = require('config/shortcuts.yaml').shortcuts;

export const Shortcut: React.FunctionComponent = () => (
    <div className="Shortcut">
        {shortcuts.map((box) => (
            <div className="Shortcut-box" key={box.title}>
                <Title subtitle size={3}>
                    {box.title}
                </Title>
                {box.keys.map((shortcut, idx) => {
                    const [keys, text] = shortcut;
                    return (
                        <div className="Shortcut-item" key={idx}>
                            <div className="Shortcut-keys">
                                {keys.map((key, i) => {
                                    if (i === 0) {
                                        return (
                                            <KeyboardKey value={key} key={i} />
                                        );
                                    }
                                    return (
                                        <React.Fragment key={i}>
                                            <span className="pr4">+</span>
                                            <KeyboardKey value={key} />
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                            <div className="Shortcut-text">{text}</div>
                        </div>
                    );
                })}
            </div>
        ))}
    </div>
);

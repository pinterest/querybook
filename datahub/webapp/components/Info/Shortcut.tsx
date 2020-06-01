import * as React from 'react';

import { KeyboardKey } from 'ui/KeyboardKey/KeyboardKey';
import { Title } from 'ui/Title/Title';

import './Shortcut.scss';

const shortcuts = require('config/shortcuts.yaml').shortcuts;

export const Shortcut: React.FunctionComponent = () => {
    return (
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
                                                <KeyboardKey>{key}</KeyboardKey>
                                            );
                                        }
                                        return (
                                            <>
                                                <span className="pr4">+</span>
                                                <KeyboardKey>{key}</KeyboardKey>
                                            </>
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
};

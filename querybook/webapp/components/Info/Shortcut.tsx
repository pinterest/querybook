import * as React from 'react';
import { startCase } from 'lodash';
import KeyMap from 'const/keyMap';
import { KeyboardKey } from 'ui/KeyboardKey/KeyboardKey';
import { Title } from 'ui/Title/Title';
import './Shortcut.scss';

export const Shortcut: React.FunctionComponent = () => (
    <div className="Shortcut">
        {Object.entries(KeyMap).map(([sectionTitle, sectionKeys]) => (
            <div className="Shortcut-box" key={sectionTitle}>
                <Title subtitle size={4}>
                    {startCase(sectionTitle)}
                </Title>
                {Object.values(sectionKeys).map((shortcut, idx) => {
                    const { key, name: keyComboName } = shortcut;
                    const keys = (key ?? '').split('-');
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
                            <div className="Shortcut-text">{keyComboName}</div>
                        </div>
                    );
                })}
            </div>
        ))}
    </div>
);

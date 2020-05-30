import * as React from 'react';

import { KeyboardKey } from 'ui/KeyboardKey/KeyboardKey';
import { Title } from 'ui/Title/Title';

import './Shortcut.scss';

export const Shortcut: React.FunctionComponent = () => {
    return (
        <div className="Shortcut">
            <div className="Shortcut-box">
                <Title subtitle size={3}>
                    overall UI
                </Title>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>k</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">open search</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>b</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">toggle sidebar</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>esc</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">close modal</div>
                </div>
            </div>
            <div className="Shortcut-box">
                <Title subtitle size={3}>
                    data doc and adhoc{' '}
                </Title>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>s</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">save datadoc</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>f</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">open search and replace</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>esc</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">
                        close search and replace
                    </div>
                </div>
            </div>
            <div className="Shortcut-box">
                <Title subtitle size={3}>
                    rich text
                </Title>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>k</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">add link</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>b</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">bold</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>i</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">italics</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>shift</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>x</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">strikethrough</div>
                </div>
            </div>
            <div className="Shortcut-box">
                <Title subtitle size={3}>
                    query editor
                </Title>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>shift</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>enter</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">run query </div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>ctrl</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>space</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">force autocompletion</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>shift</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>tab</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">indent less</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>/</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">toggle comment</div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>⌘</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>p</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">
                        open table modal if cursor is on a table
                    </div>
                </div>
                <div className="Shortcut-item">
                    <div className="Shortcut-keys">
                        <KeyboardKey>shift</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>alt</KeyboardKey>
                        <span className="pr4">+</span>
                        <KeyboardKey>f</KeyboardKey>
                    </div>
                    <div className="Shortcut-text">format query</div>
                </div>
            </div>
        </div>
    );
};

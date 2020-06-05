import React from 'react';

import { storiesOf } from '@storybook/react';
import { linkTo } from '@storybook/addon-links';

import { Welcome } from '@storybook/react/demo';

import { Button } from 'ui/Button/Button';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Select, makeSelectOptions } from 'ui/Select/Select';
import { Tabs } from 'ui/Tabs/Tabs';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

import 'stylesheets/_html.scss';
import 'stylesheets/_utilities.scss';
import 'stylesheets/_variables.scss';
import 'index.scss';

const styles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: 'var(--bg-color)',
};
const CenterDecorator = (storyFn) => <div style={styles}>{storyFn()}</div>;

storiesOf('Welcome', module).add('to Storybook', () => (
    <Welcome showApp={linkTo('Button')} />
));

storiesOf('Button', module)
    .addDecorator(CenterDecorator)
    .add('Button', () => (
        <Button
            onClick={(e) => {
                e.preventDefault();
            }}
        >
            Test Button
        </Button>
    ))
    .add('Disabled Button', () => (
        <Button
            disabled
            onClick={(e) => {
                e.preventDefault();
            }}
        >
            Disabled Button
        </Button>
    ))
    .add('Borderless Button', () => (
        <Button
            borderless
            onClick={(e) => {
                e.preventDefault();
            }}
        >
            Borderless Button
        </Button>
    ))
    .add('Pushable Button', () => (
        <Button
            pushable
            onClick={(e) => {
                e.preventDefault();
            }}
        >
            Pushable Button
        </Button>
    ))
    .add('Transparent Button', () => (
        <Button
            transparent
            onClick={(e) => {
                e.preventDefault();
            }}
        >
            Transparent Button
        </Button>
    ));

storiesOf('Copy Button', module)
    .addDecorator(CenterDecorator)
    .add('Copy Button', () => (
        <CopyButton copyText="text to copy" text="Copy To Clipboard" />
    ));

storiesOf('Async Button', module)
    .addDecorator(CenterDecorator)
    .add('Async Button', () => (
        <AsyncButton
            children={['Async ', 'Button']}
            onClick={(e) => {
                e.preventDefault();
            }}
        />
    ))
    .add('Borderless Async Button', () => (
        <AsyncButton
            children={['Borderless ', 'Async ', 'Button']}
            borderless
            onClick={(e) => {
                e.preventDefault();
            }}
        />
    ))
    .add('Transparent Async Button', () => (
        <AsyncButton
            children={['Transparent ', 'Async ', 'Button']}
            transparent
            onClick={(e) => {
                e.preventDefault();
            }}
        />
    ));

storiesOf('Debounced Input', module)
    .addDecorator(CenterDecorator)
    .add('Debounced Input', () => (
        <DebouncedInput
            flex
            inputProps={{
                placeholder: 'placeholder',
                className: 'input',
                type: 'text',
            }}
            onChange={(e) => 0}
            value=""
        />
    ))
    .add('Debounced Input with Value', () => (
        <DebouncedInput
            flex
            inputProps={{
                placeholder: 'placeholder',
                className: 'input',
                type: 'text',
            }}
            onChange={(e) => 0}
            value="test value"
        />
    ))
    .add('Debounced Input with Class', () => (
        <DebouncedInput
            className="control is-expanded"
            inputProps={{
                placeholder: 'placeholder',
                className: 'input',
                type: 'text',
            }}
            onChange={(e) => 0}
            value=""
        />
    ))
    .add('Transparent Debounced Input', () => (
        <DebouncedInput
            flex
            transparent
            inputProps={{
                placeholder: 'placeholder',
                className: 'input',
                type: 'text',
            }}
            onChange={(e) => 0}
            value=""
        />
    ));

storiesOf('Select', module)
    .addDecorator(CenterDecorator)
    .add('Select', () =>
        React.createElement(() => {
            const [value, setValue] = React.useState(1);

            const onChange = (newVal) => {
                setValue(newVal.target.value);
            };

            return (
                <Select value={value} onChange={onChange}>
                    {makeSelectOptions([
                        { label: 'one', value: 1, key: 1 },
                        { label: 'two', value: 2, key: 2 },
                    ])}
                </Select>
            );
        })
    );

// needs work
storiesOf('Tabs', module)
    .addDecorator(CenterDecorator)
    .add('Tabs', () =>
        React.createElement(() => {
            const [selectedTabKey, setSelectedTabKey] = React.useState('one');

            const onSelect = (newKey) => {
                setSelectedTabKey(newKey);
            };

            return (
                <Tabs
                    className="is-toggle"
                    items={['one', 'two', 'three']}
                    selectedTabKey={selectedTabKey}
                    onSelect={onSelect}
                />
            );
        })
    );

storiesOf('Toggle Switch', module)
    .addDecorator(CenterDecorator)
    .add('Toggle Switch', () =>
        React.createElement(() => {
            const [checked, setChecked] = React.useState(false);
            const onChange = () => {
                setChecked(!checked);
            };
            return <ToggleSwitch checked={checked} onChange={onChange} />;
        })
    );

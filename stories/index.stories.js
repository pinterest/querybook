import React from 'react';
import { storiesOf } from '@storybook/react';

import { Box } from 'ui/Box/Box';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { InfoButton } from 'ui/Button/InfoButton';
import { Card } from 'ui/Card/Card';
import { Center } from 'ui/Center/Center';
import { Checkbox } from 'ui/Form/Checkbox';
import { Column, Columns } from 'ui/Column/Column';
import { Container } from 'ui/Container/Container';
import { Content } from 'ui/Content/Content';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { DataHubLogo } from 'ui/DataHubLogo/DataHubLogo';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { DisabledSection } from 'ui/DisabledSection/DisabledSection';
import { Divider } from 'ui/Divider/Divider';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { KeyboardKey } from 'ui/KeyboardKey/KeyboardKey';
import { ListLink } from 'ui/Link/ListLink';
import { ListMenu } from 'ui/Menu/ListMenu';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
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
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: 'var(--bg-color)',
};
const CenterDecorator = (storyFn) => <div style={styles}>{storyFn()}</div>;

storiesOf('Box', module)
    .addDecorator(CenterDecorator)
    .add('Box', () => <Box>Box</Box>);

storiesOf('Button', module)
    .addDecorator(CenterDecorator)
    .add('Button', () => <Button>Button</Button>)
    .add('Disabled Button', () => <Button disabled>Disabled Button</Button>)
    .add('Loading Button', () => <Button isLoading>Loading Button</Button>)
    .add('Button Types', () => (
        <>
            <Button className="mb12" type="soft">
                Soft Button
            </Button>
            <Button className="mb12" type="inlineText">
                Inline-Text Button
            </Button>
            <Button className="mb12" type="confirm">
                Confirm Button
            </Button>
            <Button className="mb12" type="cancel">
                Cancel Button
            </Button>
        </>
    ))
    .add('Button Styles', () => (
        <>
            <Button className="mb12" pushable>
                Pushable Button
            </Button>
            <Button className="mb12" borderless>
                Borderless Button
            </Button>
            <Button className="mb12" inverted>
                Inverted Button
            </Button>
            <div className="mb12">
                <Button attachedRight>Button Attached Right</Button>
                <Button attachedLeft>Button Attached Left</Button>
            </div>
            <Button small>Small Button</Button>
        </>
    ))
    .add('Icon Button', () => <IconButton name="heart" tooltip="Icon Button" />)
    .add('Info Button', () => <InfoButton>Info Button</InfoButton>);

storiesOf('Card', module)
    .addDecorator(CenterDecorator)
    .add('Card', () => (
        <>
            <Card title="Card">Default Card Content</Card>
            <Card title="Card" flexRow>
                Flex-Row Card Content
            </Card>
            <Card title="Card" width="240px" height="160px">
                Card with Width/Height
            </Card>
        </>
    ));

storiesOf('Center', module)
    .addDecorator(CenterDecorator)
    .add('Center', () => <Center>Centers Inner Content</Center>);

storiesOf('Column', module)
    .addDecorator(CenterDecorator)
    .add('Column', () => (
        <Columns>
            <Column>First Column</Column>
            <Column>Second Column</Column>
            <Column>Third Column</Column>
        </Columns>
    ));

storiesOf('Container', module)
    .addDecorator(CenterDecorator)
    .add('Container', () => <Container>Container is Full Height</Container>);

storiesOf('Content', module)
    .addDecorator(CenterDecorator)
    .add('Content', () => (
        <Content>
            <h1>Content styles HTML</h1>
            <p>paragraph</p>
            <ul>
                <li>
                    <u>list item 1</u>
                </li>
                <li>
                    <i>list item 2</i>
                </li>
                <li>
                    <b>list item 3</b>
                </li>
            </ul>
            <code>code</code>
        </Content>
    ));

storiesOf('Copy Button', module)
    .addDecorator(CenterDecorator)
    .add('Copy Button', () => (
        <CopyButton copyText="text to copy" text="Copy To Clipboard" />
    ));

storiesOf('DataHub Logo', module)
    .addDecorator(CenterDecorator)
    .add('DataHub Logo', () => <DataHubLogo />);

storiesOf('Form Elements', module)
    .addDecorator(CenterDecorator)
    .add('Debounced Input', () => (
        <>
            <DebouncedInput
                flex
                inputProps={{
                    placeholder: 'placeholder',
                    className: 'input',
                    type: 'text',
                }}
                onChange={() => null}
                value=""
                className="mb8"
            />
            <DebouncedInput
                flex
                inputProps={{
                    placeholder: 'placeholder',
                    className: 'input',
                    type: 'text',
                }}
                onChange={() => null}
                value="with value"
                className="mb8"
            />
            <DebouncedInput
                transparent
                inputProps={{
                    placeholder: 'placeholder',
                    className: 'input',
                    type: 'text',
                }}
                onChange={() => null}
                value="transparent"
                className="mb8"
            />
        </>
    ))
    .add('Checkbox', () => (
        <>
            <Checkbox title="checkbox" onChange={() => null} />
            <Checkbox
                title="checked checkbox"
                onChange={() => null}
                value={true}
                className="mt8"
            />
        </>
    ))
    .add('Select', () =>
        React.createElement(() => {
            const [value, setValue] = React.useState(1);

            const onChange = (newVal) => {
                setValue(newVal.target.value);
            };

            return (
                <Select value={value} onChange={onChange}>
                    {makeSelectOptions([
                        { label: 'option one', value: 1, key: 1 },
                        { label: 'option two', value: 2, key: 2 },
                    ])}
                </Select>
            );
        })
    )
    .add('Simple React Select', () =>
        React.createElement(() => {
            const [value, setValue] = React.useState(1);

            const onChange = (newVal) => {
                setValue(newVal.target.value);
            };

            return (
                <SimpleReactSelect value={value} onChange={onChange}>
                    {makeSelectOptions([
                        { label: 'option one', value: 1, key: 1 },
                        { label: 'option two', value: 2, key: 2 },
                        {
                            label: 'option color dot',
                            value: 3,
                            key: 3,
                            color: '#35B5BB',
                        },
                    ])}
                </SimpleReactSelect>
            );
        })
    );

storiesOf('Disabled Section', module)
    .addDecorator(CenterDecorator)
    .add('Disabled Section', () => (
        <DisabledSection>
            <DebouncedInput
                flex
                inputProps={{
                    placeholder: 'placeholder',
                    className: 'input',
                    type: 'text',
                }}
                onChange={() => null}
                value="disabled input"
            />
        </DisabledSection>
    ));

storiesOf('Divider', module)
    .addDecorator(CenterDecorator)
    .add('Divider', () => (
        <div style={{ width: '240px' }}>
            <div>Default Divder</div>
            <Divider />
            <div>Styled Divder</div>
            <Divider color="var(--color-accent)" height="4px" />
        </div>
    ));

storiesOf('Dropdown', module)
    .addDecorator(CenterDecorator)
    .add('Dropdown', () => (
        <>
            <Dropdown>
                <ListMenu
                    items={[
                        { name: 'Default Dropdown' },
                        { name: 'with ListMenu' },
                    ]}
                />
            </Dropdown>
            <Dropdown
                isRight
                isUp
                customButtonRenderer={() => (
                    <Button borderless icon={'heart'} />
                )}
            >
                <ListMenu
                    items={[
                        { name: 'Content shown right & up' },
                        { name: 'with Custom Button' },
                    ]}
                />
            </Dropdown>
            <Dropdown
                customButtonRenderer={() => (
                    <Button borderless icon={'more-vertical'} type="soft" />
                )}
            >
                <ListMenu
                    items={[
                        { name: 'Soft Dropdown' },
                        { name: 'with Custom Button' },
                        {
                            name: 'Nested Item',
                            items: [
                                { name: 'Nested Option 1' },
                                { name: 'Nested Option 2' },
                            ],
                        },
                    ]}
                    soft
                />
            </Dropdown>
        </>
    ));

storiesOf('Icon', module)
    .addDecorator(CenterDecorator)
    .add('Icon', () => <Icon name="heart" />);

storiesOf('Keyboard Key', module)
    .addDecorator(CenterDecorator)
    .add('Keyboard Key', () => <KeyboardKey value="esc" />);

storiesOf('List Link', module)
    .addDecorator(CenterDecorator)
    .add('List Link', () => (
        <div styles={{ width: '160px' }}>
            <ListLink onClick={() => null}>List Link 1</ListLink>
            <ListLink className="selected" onClick={() => null}>
                List Link 2 Selected
            </ListLink>
            <ListLink onClick={() => null}>List Link 3</ListLink>
        </div>
    ));

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

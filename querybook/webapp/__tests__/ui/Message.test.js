import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import { ErrorMessage } from '../../ui/Message/ErrorMessage';
import { Message } from '../../ui/Message/Message';

it('renders without crashing', () => {
    shallow(
        <Message className="TestMessage" icon="Zap" iconSize={20} type="tip">
            Test
        </Message>
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Message>Test</Message>);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - with options', () => {
        const wrapper = shallow(
            <Message
                title="Test Message"
                message="this is a test message"
                className="TestMessage"
                icon="check"
                iconSize={20}
                type="tip"
            >
                Test
            </Message>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - error', () => {
        const wrapper = shallow(<ErrorMessage>Test</ErrorMessage>);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles - error', () => {
        const output = renderer.create(<ErrorMessage>Test</ErrorMessage>);
        expect(output).toMatchSnapshot();
    });
});

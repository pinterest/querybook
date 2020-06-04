import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Message } from '../../ui/Message/Message';
import { ErrorMessage } from '../../ui/Message/ErrorMessage';

it('renders without crashing', () => {
    shallow(
        <Message
            className="ErrorSuggestion"
            icon="zap"
            iconSize={20}
            type="tip"
        >
            Test
        </Message>
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<Message>Test</Message>);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - with options', () => {
        let wrapper = shallow(
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
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - error', () => {
        let wrapper = shallow(<ErrorMessage>Test</ErrorMessage>);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<Message>Test</Message>);
        expect(output).toMatchSnapshot();
    });
    it('serializes the styles - error', () => {
        const output = renderer.create(<ErrorMessage>Test</ErrorMessage>);
        expect(output).toMatchSnapshot();
    });
});

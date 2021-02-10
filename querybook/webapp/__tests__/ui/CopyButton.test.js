import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { CopyButton } from '../../ui/CopyButton/CopyButton';

it('renders without crashing', () => {
    shallow(
        <CopyButton
            type="text"
            size="small"
            copyText="Text to be copied"
            icon="link"
            title="Test Copy"
        />
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <CopyButton
                type="text"
                size="small"
                copyText="Text to be copied"
                icon="link"
                title="Test Copy"
            />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <CopyButton
                type="text"
                size="small"
                copyText="Text to be copied"
                icon="link"
                title="Test Copy"
            />
        );
        expect(output).toMatchSnapshot();
    });
});

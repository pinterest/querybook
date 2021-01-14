import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Center } from '../../ui/Center/Center';

it('renders without crashing', () => {
    shallow(<Center>Test</Center>);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Center>Test</Center>);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<Center>Test</Center>);
        expect(output).toMatchSnapshot();
    });
});

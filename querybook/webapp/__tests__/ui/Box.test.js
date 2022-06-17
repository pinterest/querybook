import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import { Box } from '../../ui/Box/Box';

it('renders without crashing', () => {
    shallow(<Box>Test</Box>);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Box>Test</Box>);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<Box>Test</Box>);
        expect(output).toMatchSnapshot();
    });
});

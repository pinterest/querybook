import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Link } from '../../ui/Link/Link';

it('renders without crashing', () => {
    shallow(<Link to="https://test.com" />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Link to="https://test.com" />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<Link to="https://test.com" />);
        expect(output).toMatchSnapshot();
    });
});

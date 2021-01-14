import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { KeyboardKey } from '../../ui/KeyboardKey/KeyboardKey';

it('renders without crashing', () => {
    shallow(<KeyboardKey value="test" />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<KeyboardKey value="test" />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<KeyboardKey value="test" />);
        expect(output).toMatchSnapshot();
    });
});

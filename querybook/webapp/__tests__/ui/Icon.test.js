import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import { Icon } from '../../ui/Icon/Icon';

it('renders without crashing', () => {
    mount(<Icon name="Check" />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = mount(<Icon name="Check" />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<Icon name="Check" />);
        expect(output).toMatchSnapshot();
    });
});

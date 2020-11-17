import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Icon } from '../../ui/Icon/Icon';

it('renders without crashing', () => {
    mount(<Icon name="check" />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = mount(<Icon name="check" />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<Icon name="check" />);
        expect(output).toMatchSnapshot();
    });
});

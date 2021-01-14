import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { ListMenu } from '../../ui/Menu/ListMenu';

const items = [{ name: 'test' }];

it('renders without crashing', () => {
    shallow(<ListMenu items={items} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<ListMenu items={items} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<ListMenu items={items} />);
        expect(output).toMatchSnapshot();
    });
});

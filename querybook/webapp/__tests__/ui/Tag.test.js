import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import { Tag } from '../../ui/Tag/Tag';

it('renders without crashing', () => {
    shallow(<Tag>test</Tag>);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Tag>test</Tag>);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        const wrapper = shallow(<Tag highlighted>test</Tag>);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

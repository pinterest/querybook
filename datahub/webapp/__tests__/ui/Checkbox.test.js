import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { Checkbox } from '../../ui/Checkbox/Checkbox';

it('renders without crashing', () => {
    shallow(<Checkbox />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Checkbox />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

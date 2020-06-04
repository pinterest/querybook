import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { Checkbox } from '../../ui/Form/Checkbox';

it('renders without crashing', () => {
    shallow(<Checkbox />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<Checkbox />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

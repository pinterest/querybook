import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { Timer } from '../../ui/Timer/Timer';

it('renders without crashing', () => {
    shallow(<Timer />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Timer />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

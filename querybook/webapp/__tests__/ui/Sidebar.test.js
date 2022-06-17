import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import { Sidebar } from '../../ui/Sidebar/Sidebar';

it('renders without crashing', () => {
    shallow(<Sidebar />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Sidebar />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

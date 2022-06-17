import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import { StatusIcon } from '../../ui/StatusIcon/StatusIcon';

it('renders without crashing', () => {
    shallow(<StatusIcon status="success" />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<StatusIcon status="success" />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - warning', () => {
        const wrapper = shallow(<StatusIcon status="warning" />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

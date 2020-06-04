import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { StatusIcon } from '../../ui/StatusIcon/StatusIcon';

it('renders without crashing', () => {
    shallow(<StatusIcon status="success" />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<StatusIcon status="success" />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - warning', () => {
        let wrapper = shallow(<StatusIcon status="warning" />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

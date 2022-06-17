import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import { Popover } from '../../ui/Popover/Popover';

it('renders without crashing', () => {
    shallow(<Popover onHide={() => null}>Test</Popover>);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Popover onHide={() => null}>Test</Popover>);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

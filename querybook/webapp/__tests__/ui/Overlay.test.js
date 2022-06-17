import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import { Overlay } from '../../ui/Overlay/Overlay';

it('renders without crashing', () => {
    shallow(<Overlay>Test</Overlay>);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Overlay>Test</Overlay>);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

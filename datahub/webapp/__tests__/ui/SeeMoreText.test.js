import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { SeeMoreText } from '../../ui/SeeMoreText/SeeMoreText';

it('renders without crashing', () => {
    shallow(<SeeMoreText text="test" length={2} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<SeeMoreText text="test" length={2} />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

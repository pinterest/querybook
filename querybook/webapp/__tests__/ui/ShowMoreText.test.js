import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import { ShowMoreText } from '../../ui/ShowMoreText/ShowMoreText';

it('renders without crashing', () => {
    shallow(<ShowMoreText text="test" length={2} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<ShowMoreText text="test" length={2} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

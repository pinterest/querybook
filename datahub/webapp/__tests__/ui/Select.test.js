import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { Select } from '../../ui/Select/Select';

it('renders without crashing', () => {
    shallow(<Select value="test" onChange={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<Select value="test" onChange={() => null} />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - placeholder', () => {
        let wrapper = shallow(
            <Select value="test" onChange={() => null} disabled />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

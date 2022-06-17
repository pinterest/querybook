import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import { InfoButton } from '../../ui/Button/InfoButton';

it('renders without crashing', () => {
    shallow(<InfoButton>Test</InfoButton>);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<InfoButton>Test</InfoButton>);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

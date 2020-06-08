import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { StepsBar } from '../../ui/StepsBar/StepsBar';

it('renders without crashing', () => {
    shallow(<StepsBar steps={[]} activeStep={0} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<StepsBar steps={[]} activeStep={0} />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        let wrapper = shallow(
            <StepsBar steps={['one', 'two']} activeStep={0} />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import { StepsBar } from '../../ui/StepsBar/StepsBar';

it('renders without crashing', () => {
    shallow(<StepsBar steps={[]} activeStep={0} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<StepsBar steps={[]} activeStep={0} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        const wrapper = shallow(
            <StepsBar steps={['one', 'two']} activeStep={0} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

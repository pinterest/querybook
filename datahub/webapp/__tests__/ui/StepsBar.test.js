import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { StepsBar } from '../../ui/StepsBar/StepsBar';

it('renders without crashing', () => {
    shallow(<StepsBar steps={[]} currentStep={0} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<StepsBar steps={[]} currentStep={0} />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<StepsBar steps={[]} currentStep={0} />);
        expect(output).toMatchSnapshot();
    });
});

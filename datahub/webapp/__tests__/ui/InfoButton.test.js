import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { InfoButton } from '../../ui/Button/InfoButton';

it('renders without crashing', () => {
    shallow(<InfoButton>Test</InfoButton>);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<InfoButton>Test</InfoButton>);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - layout', () => {
        let wrapper = shallow(
            <InfoButton layout={['bottom', 'right']}>Test</InfoButton>
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - popoverClassName', () => {
        let wrapper = shallow(
            <InfoButton popoverClassName="TestInfoButton">Test</InfoButton>
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

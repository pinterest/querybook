import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { ToggleSwitch } from '../../ui/ToggleSwitch/ToggleSwitch';

it('renders without crashing', () => {
    shallow(<ToggleSwitch checked={true} onChange={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(
            <ToggleSwitch checked={true} onChange={() => null} />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - unchecked', () => {
        let wrapper = shallow(
            <ToggleSwitch checked={false} onChange={() => null} />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

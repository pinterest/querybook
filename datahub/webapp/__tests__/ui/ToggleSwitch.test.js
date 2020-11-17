import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { ToggleSwitch } from '../../ui/ToggleSwitch/ToggleSwitch';

it('renders without crashing', () => {
    shallow(<ToggleSwitch checked={true} onChange={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <ToggleSwitch checked={true} onChange={() => null} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - unchecked', () => {
        const wrapper = shallow(
            <ToggleSwitch checked={false} onChange={() => null} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

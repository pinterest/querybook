import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { ToggleButton } from '../../ui/ToggleButton/ToggleButton';

it('renders without crashing', () => {
    shallow(
        <ToggleButton checked={true} onClick={() => null} title="Testing" />
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <ToggleButton checked={true} onClick={() => null} title="Testing" />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - unchecked', () => {
        const wrapper = shallow(
            <ToggleButton
                checked={false}
                onClick={() => null}
                title="Testing"
            />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

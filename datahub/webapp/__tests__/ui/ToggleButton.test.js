import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { ToggleButton } from '../../ui/ToggleButton/ToggleButton';

it('renders without crashing', () => {
    shallow(
        <ToggleButton checked={true} onChange={() => null} title="Testing" />
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(
            <ToggleButton
                checked={true}
                onChange={() => null}
                title="Testing"
            />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - unchecked', () => {
        let wrapper = shallow(
            <ToggleButton
                checked={false}
                onChange={() => null}
                title="Testing"
            />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <ToggleButton
                checked={true}
                onChange={() => null}
                title="Testing"
            />
        );
        expect(output).toMatchSnapshot();
    });
});

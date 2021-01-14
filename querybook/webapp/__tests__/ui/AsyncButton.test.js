import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { AsyncButton } from '../../ui/AsyncButton/AsyncButton';

it('renders without crashing', () => {
    shallow(<AsyncButton title="test" onClick={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <AsyncButton title="test" onClick={() => null} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - disbled', () => {
        const wrapper = shallow(
            <AsyncButton title="test" onClick={() => null} disabled />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <AsyncButton title="test" onClick={() => null} />
        );
        expect(output).toMatchSnapshot();
    });
});

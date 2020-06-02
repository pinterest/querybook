import React from 'react';
import { shallow } from 'enzyme';
import { AsyncButton } from '../../ui/AsyncButton/AsyncButton';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

it('renders without crashing', () => {
    shallow(<AsyncButton title="test" onClick={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(
            <AsyncButton title="test" onClick={() => null} />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - disbled', () => {
        let wrapper = shallow(
            <AsyncButton title="test" onClick={() => null} disabled />
        );
        let serialized = toJson(wrapper);
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

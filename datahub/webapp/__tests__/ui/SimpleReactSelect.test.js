import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { SimpleReactSelect } from '../../ui/SimpleReactSelect/SimpleReactSelect';

it('renders without crashing', () => {
    shallow(
        <SimpleReactSelect options={[]} value="test" onChange={() => null} />
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <SimpleReactSelect
                options={[]}
                value="test"
                onChange={() => null}
            />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <SimpleReactSelect
                options={[]}
                value="test"
                onChange={() => null}
            />
        );
        expect(output).toMatchSnapshot();
    });
});

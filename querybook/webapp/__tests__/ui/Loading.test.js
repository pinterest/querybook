import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import { Loading } from '../../ui/Loading/Loading';

it('renders without crashing', () => {
    shallow(<Loading />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Loading />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<Loading />);
        expect(output).toMatchSnapshot();
    });
});

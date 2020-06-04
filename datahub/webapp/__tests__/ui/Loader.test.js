import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Loader } from '../../ui/Loader/Loader';

it('renders without crashing', () => {
    shallow(<Loader />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<Loader />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        let wrapper = shallow(<Loader item="test">children</Loader>);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<Loader />);
        expect(output).toMatchSnapshot();
    });
});

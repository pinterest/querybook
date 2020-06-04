import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { ErrorPage } from '../../ui/ErrorPage/ErrorPage';
import { FourOhFour } from '../../ui/ErrorPage/FourOhFour';
import { FourOhThree } from '../../ui/ErrorPage/FourOhThree';

it('renders without crashing', () => {
    shallow(<ErrorPage />);
});
it('renders without crashing', () => {
    shallow(<FourOhFour />);
});
it('renders without crashing', () => {
    shallow(<FourOhThree />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<ErrorPage />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        let wrapper = shallow(<FourOhFour />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        let wrapper = shallow(<FourOhThree />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

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
        const wrapper = shallow(<ErrorPage />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        const wrapper = shallow(<FourOhFour />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        const wrapper = shallow(<FourOhThree />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

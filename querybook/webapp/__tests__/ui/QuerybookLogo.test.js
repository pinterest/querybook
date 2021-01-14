import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { QuerybookLogo } from '../../ui/QuerybookLogo/QuerybookLogo';

it('renders without crashing', () => {
    shallow(<QuerybookLogo />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<QuerybookLogo />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - size', () => {
        const wrapper = shallow(<QuerybookLogo size={8} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<QuerybookLogo />);
        expect(output).toMatchSnapshot();
    });
});

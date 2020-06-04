import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { StatusIcon } from '../../ui/StatusIcon/StatusIcon';

it('renders without crashing', () => {
    shallow(<StatusIcon status="success" />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<StatusIcon status="success" />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        let wrapper = shallow(<StatusIcon status="warning" />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<StatusIcon status="success" />);
        expect(output).toMatchSnapshot();
    });
});

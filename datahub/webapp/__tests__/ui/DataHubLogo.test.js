import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { DataHubLogo } from '../../ui/DataHubLogo/DataHubLogo';

it('renders without crashing', () => {
    shallow(<DataHubLogo />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<DataHubLogo />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - size', () => {
        const wrapper = shallow(<DataHubLogo size={8} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<DataHubLogo />);
        expect(output).toMatchSnapshot();
    });
});

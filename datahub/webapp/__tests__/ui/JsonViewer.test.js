import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { JsonViewer } from '../../ui/JsonViewer/JsonViewer';

it('renders without crashing', () => {
    shallow(<JsonViewer value={{ test: 'test' }} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<JsonViewer value={{ test: 'test' }} />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<JsonViewer value={{ test: 'test' }} />);
        expect(output).toMatchSnapshot();
    });
});

import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { FullHeight } from '../../ui/FullHeight/FullHeight';

it('renders without crashing', () => {
    shallow(<FullHeight>Test</FullHeight>);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <FullHeight className="TestFullHeight">Test</FullHeight>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <FullHeight className="TestFullHeight">Test</FullHeight>
        );
        expect(output).toMatchSnapshot();
    });
});

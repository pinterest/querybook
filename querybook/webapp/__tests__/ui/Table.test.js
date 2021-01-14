import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Table } from '../../ui/Table/Table';

it('renders without crashing', () => {
    shallow(<Table rows={[1, 2]} cols={[1, 2]} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Table rows={[1, 2]} cols={[1, 2]} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<Table rows={[1, 2]} cols={[1, 2]} />);
        expect(output).toMatchSnapshot();
    });
});

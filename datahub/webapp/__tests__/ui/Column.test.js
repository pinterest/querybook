import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Columns, Column } from '../../ui/Column/Column';

it('renders without crashing', () => {
    shallow(
        <Columns>
            <Column>Test</Column>
            <Column>Test</Column>
        </Columns>
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <Columns>
                <Column>Test</Column>
                <Column>Test</Column>
            </Columns>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <Columns>
                <Column>Test</Column>
                <Column>Test</Column>
            </Columns>
        );
        expect(output).toMatchSnapshot();
    });
});

import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import { Column, Columns } from '../../ui/Column/Column';

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

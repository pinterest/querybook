import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Container } from '../../ui/Container/Container';

it('renders without crashing', () => {
    shallow(<Container>Test</Container>);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <Container className="TestContainer">Test</Container>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <Container className="TestContainer">Test</Container>
        );
        expect(output).toMatchSnapshot();
    });
});

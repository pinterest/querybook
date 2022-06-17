import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import { Content } from '../../ui/Content/Content';

it('renders without crashing', () => {
    shallow(<Content dangerouslySetInnerHTML={{ __html: '<p>test</p>' }} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <Content dangerouslySetInnerHTML={{ __html: '<p>test</p>' }} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <Content dangerouslySetInnerHTML={{ __html: '<p>test</p>' }} />
        );
        expect(output).toMatchSnapshot();
    });
});

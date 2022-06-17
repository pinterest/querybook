import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import { ResizableTextArea } from '../../ui/ResizableTextArea/ResizableTextArea';

it('renders without crashing', () => {
    shallow(<ResizableTextArea value={'test'} onChange={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <ResizableTextArea value={'test'} onChange={() => null} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <ResizableTextArea value={'test'} onChange={() => null} />
        );
        expect(output).toMatchSnapshot();
    });
});

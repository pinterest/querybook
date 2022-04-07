import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { FlowGraph } from '../../ui/FlowGraph/FlowGraph';

it('renders without crashing', () => {
    shallow(<FlowGraph nodes={[]} edges={[]} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<FlowGraph nodes={[]} edges={[]} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

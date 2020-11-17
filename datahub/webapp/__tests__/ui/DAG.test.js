import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { DAG } from '../../ui/DAG/DAG';

it('renders without crashing', () => {
    shallow(<DAG nodes={[]} edges={[]} onNodeClick={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <DAG nodes={[]} edges={[]} onNodeClick={() => null} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

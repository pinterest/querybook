import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { DAG } from '../../ui/DAG/DAG';

it('renders without crashing', () => {
    shallow(<DAG nodes={[]} edges={[]} onNodeClick={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(
            <DAG nodes={[]} edges={[]} onNodeClick={() => null} />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { EditableTextField } from '../../ui/EditableTextField/EditableTextField';

it('renders without crashing', () => {
    shallow(<EditableTextField value="test" onSave={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <EditableTextField value="test" onSave={() => null} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

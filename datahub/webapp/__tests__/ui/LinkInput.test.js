import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { LinkInput } from '../../ui/RichTextEditorToolBar/LinkInput';

it('renders without crashing', () => {
    shallow(<LinkInput />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<LinkInput />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

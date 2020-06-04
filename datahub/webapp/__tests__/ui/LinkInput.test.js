import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { LinkInput } from '../../ui/RichTextEditorToolBar/LinkInput';

it('renders without crashing', () => {
    shallow(<LinkInput />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<LinkInput />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<LinkInput />);
        expect(output).toMatchSnapshot();
    });
});

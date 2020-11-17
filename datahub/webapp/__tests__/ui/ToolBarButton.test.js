import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { ToolBarButton } from '../../ui/RichTextEditorToolBar/ToolBarButton';

it('renders without crashing', () => {
    shallow(<ToolBarButton icon="check" />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<ToolBarButton icon="check" />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(<ToolBarButton icon="check" />);
        expect(output).toMatchSnapshot();
    });
});

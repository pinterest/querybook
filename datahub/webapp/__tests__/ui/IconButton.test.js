import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { IconButton } from '../../ui/Button/IconButton';

it('renders without crashing', () => {
    shallow(<IconButton icon="check" onClick={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(<IconButton icon="check" onClick={() => null} />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - disbled', () => {
        let wrapper = shallow(
            <IconButton icon="check" onClick={() => null} disabled />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - active', () => {
        let wrapper = shallow(
            <IconButton icon="check" onClick={() => null} active />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - with tooltip', () => {
        let wrapper = shallow(
            <IconButton
                icon="check"
                onClick={() => null}
                tooltip="test"
                tooltipPos="right"
            />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - with ping', () => {
        let wrapper = shallow(
            <IconButton icon="check" onClick={() => null} ping={true} />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - with ping message', () => {
        let wrapper = shallow(
            <IconButton icon="check" onClick={() => null} ping="1" />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - mixed', () => {
        let wrapper = shallow(
            <IconButton
                icon="check"
                onClick={() => null}
                noPadding
                fill
                ping="1"
            />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <IconButton icon="check" onClick={() => null} />
        );
        expect(output).toMatchSnapshot();
    });
});

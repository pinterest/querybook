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
        const wrapper = shallow(<IconButton icon="check" onClick={() => null} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - disbled', () => {
        const wrapper = shallow(
            <IconButton icon="check" onClick={() => null} disabled />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - active', () => {
        const wrapper = shallow(
            <IconButton icon="check" onClick={() => null} active />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - with tooltip', () => {
        const wrapper = shallow(
            <IconButton
                icon="check"
                onClick={() => null}
                tooltip="test"
                tooltipPos="right"
            />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - with ping', () => {
        const wrapper = shallow(
            <IconButton icon="check" onClick={() => null} ping={true} />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - with ping message', () => {
        const wrapper = shallow(
            <IconButton icon="check" onClick={() => null} ping="1" />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - mixed', () => {
        const wrapper = shallow(
            <IconButton
                icon="check"
                onClick={() => null}
                noPadding
                fill
                ping="1"
            />
        );
        const serialized = toJson(wrapper);
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

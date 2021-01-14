import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { Button } from '../../ui/Button/Button';

it('renders without crashing', () => {
    shallow(<Button title="test" onClick={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Button title="test" onClick={() => null} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - disbled', () => {
        const wrapper = shallow(
            <Button title="test" onClick={() => null} disabled />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - typed', () => {
        const wrapper = shallow(
            <Button title="test" onClick={() => null} type="soft" />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - borderless', () => {
        const wrapper = shallow(
            <Button title="test" onClick={() => null} borderless />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - attachedRight', () => {
        const wrapper = shallow(
            <Button title="test" onClick={() => null} attachedRight />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - isLoading', () => {
        const wrapper = shallow(
            <Button title="test" onClick={() => null} isLoading />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - mixed', () => {
        const wrapper = shallow(
            <Button
                title="test"
                onClick={() => null}
                pushable
                transparent
                small
                inverted
                attachedLeft
            />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <Button title="test" onClick={() => null} />
        );
        expect(output).toMatchSnapshot();
    });
});

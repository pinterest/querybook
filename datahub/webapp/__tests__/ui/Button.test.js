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
        let wrapper = shallow(<Button title="test" onClick={() => null} />);
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - disbled', () => {
        let wrapper = shallow(
            <Button title="test" onClick={() => null} disabled />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - typed', () => {
        let wrapper = shallow(
            <Button title="test" onClick={() => null} type="soft" />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - borderless', () => {
        let wrapper = shallow(
            <Button title="test" onClick={() => null} borderless />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - attachedRight', () => {
        let wrapper = shallow(
            <Button title="test" onClick={() => null} attachedRight />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - isLoading', () => {
        let wrapper = shallow(
            <Button title="test" onClick={() => null} isLoading />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - mixed', () => {
        let wrapper = shallow(
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
        let serialized = toJson(wrapper);
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

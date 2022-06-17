import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
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
            <Button
                title="test"
                onClick={() => null}
                color="light"
                theme="fill"
            />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - text button', () => {
        const wrapper = shallow(
            <Button title="test" onClick={() => null} theme="text" />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - attached right', () => {
        const wrapper = shallow(
            <Button title="test" onClick={() => null} attached="right" />
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
                size="small"
                attached="left"
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

import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { DebouncedInput } from '../../ui/DebouncedInput/DebouncedInput';

it('renders without crashing', () => {
    shallow(<DebouncedInput value="test" onChange={() => null} />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        let wrapper = shallow(
            <DebouncedInput value="test" onChange={() => null} />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - placeholder', () => {
        let wrapper = shallow(
            <DebouncedInput
                value="test"
                onChange={() => null}
                inputProps={{ placeholder: 'test placeholder' }}
            />
        );
        let serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

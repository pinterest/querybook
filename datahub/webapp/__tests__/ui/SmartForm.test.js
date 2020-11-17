import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import renderer from 'react-test-renderer';

import { SmartForm } from '../../ui/SmartForm/SmartForm';

it('renders without crashing', () => {
    shallow(
        <SmartForm
            formField={{
                of: {
                    description: 'test',
                },
                max: null,
                min: 1,
            }}
            value={[]}
            onChange={() => null}
        />
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <SmartForm
                formField={{
                    of: {
                        description: 'test',
                    },
                    max: null,
                    min: 1,
                }}
                value={[]}
                onChange={() => null}
            />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <SmartForm
                formField={{
                    of: {
                        description: 'test',
                    },
                    max: null,
                    min: 1,
                }}
                value={[]}
                onChange={() => null}
            />
        );
        expect(output).toMatchSnapshot();
    });
    it('serializes the styles', () => {
        const output = renderer.create(
            <SmartForm
                formField={{
                    field_type: 'struct',
                    of: {
                        description: 'test',
                    },
                    max: null,
                    min: 1,
                    fields: [],
                }}
                value={[]}
                onChange={() => null}
            />
        );
        expect(output).toMatchSnapshot();
    });
});

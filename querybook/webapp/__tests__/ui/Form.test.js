import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import {
    FormField,
    FormFieldErrorSection,
    FormFieldHelpSection,
    FormFieldInputSection,
    FormFieldInputSectionRow,
    FormFieldInputSectionRowGroup,
} from '../../ui/Form/FormField';
import { FormWrapper } from '../../ui/Form/FormWrapper';

it('renders without crashing', () => {
    shallow(<FormField />);
});
it('renders without crashing', () => {
    shallow(
        <FormField>
            <FormFieldInputSectionRowGroup>
                <FormFieldInputSectionRow>
                    <FormFieldInputSection>Test</FormFieldInputSection>
                </FormFieldInputSectionRow>
                <FormFieldHelpSection>Test</FormFieldHelpSection>
                <FormFieldErrorSection>Test</FormFieldErrorSection>
            </FormFieldInputSectionRowGroup>
        </FormField>
    );
});
it('renders without crashing', () => {
    shallow(<FormWrapper />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<FormField />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        const wrapper = shallow(<FormWrapper />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

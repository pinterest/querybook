import React from 'react';
import Heading from '../Heading';
import InputField from './InputField';

export default () => {
    const [formValue, setFormValue] = React.useState({
        name: '',
        company: '',
        email: '',
    });

    return (
        <div className="TryItOut container">
            <Heading
                headingKey="Interested?"
                title="Request Demo"
                subtitle="Please enter the contact information here and we will reach out to you."
            />
            <div className="flex-column">
                <InputField
                    placeholder="Name"
                    value={formValue.name}
                    onChange={(name) =>
                        setFormValue((oldValue) => ({ ...oldValue, name }))
                    }
                />
                <InputField
                    placeholder="Company"
                    value={formValue.company}
                    onChange={(company) =>
                        setFormValue((oldValue) => ({ ...oldValue, company }))
                    }
                />
                <InputField
                    placeholder="Email"
                    value={formValue.email}
                    onChange={(email) =>
                        setFormValue((oldValue) => ({ ...oldValue, email }))
                    }
                />
                <div>
                    <span className="button button--outline button--secondary">
                        Submit
                    </span>
                </div>
            </div>
        </div>
    );
};

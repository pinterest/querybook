import React from 'react';
import Heading from '../Heading';
import './index.scss';

export default () => {
    return (
        <div className="TryItOut container">
            <Heading
                headingKey="Interested in trying it out?"
                title="Waitlist"
                subtitle="Please enter your contact information and we will reach out to you once DataHub is ready to be open sourced."
            />
            <div className="form-container">
                <iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLScOkqT7IBIhWIGSnfeBEKZ0uNiHvCACpV4C_Jcyk6Z5gzNK-Q/viewform?embedded=true"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    marginHeight="0"
                    marginWidth="0"
                >
                    Loading…
                </iframe>
            </div>
        </div>
    );
};

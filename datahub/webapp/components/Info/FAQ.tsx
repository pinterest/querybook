import * as React from 'react';
import { Title } from 'ui/Title/Title';

import './FAQ.scss';

const faqs = [['Question?', 'answer']];

export const FAQ: React.FunctionComponent = () => {
    return (
        <div className="FAQ">
            {faqs.map((faq, idx) => {
                const question = faq[0];
                const answer = faq[1];
                return (
                    <div className="FAQ-item mb8" key={idx}>
                        <Title subtitle size={4} className="FAQ-question">
                            {question}
                        </Title>
                        <div className="FAQ-answer mv8 mh12">{answer}</div>
                    </div>
                );
            })}
        </div>
    );
};

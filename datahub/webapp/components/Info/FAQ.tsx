import * as React from 'react';

import { Content } from 'ui/Content/Content';
import { Title } from 'ui/Title/Title';

import './FAQ.scss';

const faqs = require('config/faqs.yaml').faqs;

export const FAQ: React.FunctionComponent = () => {
    return (
        <div className="FAQ m12">
            {faqs.map((faq, idx) => {
                const [question, answer] = faq;
                return (
                    <div className="FAQ-item mb24" key={idx}>
                        <Title subtitle size={4} className="FAQ-question">
                            {question}
                        </Title>
                        <div className="FAQ-answer m12">
                            <Content
                                dangerouslySetInnerHTML={{ __html: answer }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

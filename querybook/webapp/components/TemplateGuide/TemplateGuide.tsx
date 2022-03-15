import React, { useState } from 'react';
import { Markdown } from 'ui/Markdown/Markdown';
import { Modal } from 'ui/Modal/Modal';
import { Tabs } from 'ui/Tabs/Tabs';
import {
    TTemplateGuideSection,
    GUIDE_SECTIONS,
    GUIDE_CONTENT_PER_SECTION,
} from './GuideContent';

export const TemplateGuideModal: React.FC<{
    onHide: () => void;
}> = ({ onHide }) => {
    const [section, setSection] = useState<TTemplateGuideSection>('Syntax');

    return (
        <Modal
            onHide={onHide}
            title={'Template Guide'}
            topDOM={
                <Tabs
                    selectedTabKey={section}
                    items={GUIDE_SECTIONS}
                    onSelect={setSection as any}
                />
            }
        >
            <Markdown>{GUIDE_CONTENT_PER_SECTION[section]}</Markdown>
        </Modal>
    );
};

export const TemplateGuide: React.FC = () => {
    const [section, setSection] = useState<TTemplateGuideSection>('Syntax');

    return (
        <div>
            <Tabs
                selectedTabKey={section}
                items={GUIDE_SECTIONS}
                onSelect={setSection as any}
                className="mb8"
            />
            <Markdown>{GUIDE_CONTENT_PER_SECTION[section]}</Markdown>
        </div>
    );
};

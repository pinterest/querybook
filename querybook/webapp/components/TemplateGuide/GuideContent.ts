export const GUIDE_SECTIONS = ['Syntax', 'Predefined'] as const;
export type TTemplateGuideSection = typeof GUIDE_SECTIONS[number];

export const GUIDE_CONTENT_PER_SECTION: Record<TTemplateGuideSection, string> =
    {
        Syntax: require('./guides/syntax.md'),
        Predefined: require('./guides/predefined.md'),
    };

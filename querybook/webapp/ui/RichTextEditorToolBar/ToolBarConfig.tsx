import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';

export interface IToolBarButtonConfig {
    icon?: AllLucideIconNames;
    tooltip: string;
    type?: string;
    style?: string;
    label?: string;
}
export const styleButtonsConfig: IToolBarButtonConfig[] = [
    { icon: 'Bold', style: 'BOLD', tooltip: 'Bold ⌘B' },
    { icon: 'Italic', style: 'ITALIC', tooltip: 'Italic ⌘I' },
    { icon: 'Strikethrough', style: 'STRIKETHROUGH', tooltip: 'Strikethrough' },
    { icon: 'Underline', style: 'UNDERLINE', tooltip: 'Underline ⌘U' },
];
export const blockButtonsConfig: IToolBarButtonConfig[] = [
    { style: 'header-one', label: 'Title', tooltip: 'Title' },
    {
        style: 'header-two',
        label: 'Subtitle',
        tooltip: 'Subtitle',
    },
    { icon: 'List', style: 'unordered-list-item', tooltip: 'Bullet Points' },
    { icon: 'ListOrdered', style: 'ordered-list-item', tooltip: 'List' },
    { icon: 'Quote', style: 'blockquote', tooltip: 'Quote' },
];
export const entityButtonsConfig: IToolBarButtonConfig[] = [
    { icon: 'Link', type: 'link', tooltip: 'Add Link' },
    // {icon: 'image', type: 'image', tooltip: 'Insert Image'},
];

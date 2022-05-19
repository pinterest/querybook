interface IColorPalette {
    name: string;
    color: string;
    fillColor: string;
}
export const ColorPalette: IColorPalette[] = [
    { name: 'blue', color: '#35B5BB', fillColor: 'rgba(53, 181, 187, 0.25)' },
    { name: 'pink', color: '#ff3975', fillColor: 'rgba(255, 57, 117, 0.25)' },
    { name: 'grey', color: '#bfbfbf', fillColor: 'rgba(191, 191, 191, 0.25)' },
    { name: 'gold', color: '#ffca00', fillColor: 'rgba(255, 202, 0, 0.25)' },
    { name: 'blue', color: '#529dce', fillColor: 'rgba(82, 157, 206, 0.25)' },
    { name: 'orange', color: '#ff9f42', fillColor: 'rgba(255, 159, 66, 0.25)' },
    {
        name: 'creamy forest green',
        color: '#6ba097',
        fillColor: 'rgba(107, 160, 151, 0.25)',
    },
    {
        name: 'chartreuse',
        color: '#aee800',
        fillColor: 'rgba(174, 232, 0, 0.25)',
    },
    {
        name: 'baby pink',
        color: '#ff91c8',
        fillColor: 'rgba(255, 145, 200, 0.25)',
    },
    {
        name: 'icy blue',
        color: '#85d0ce',
        fillColor: 'rgba(133, 208, 206, 0.25)',
    },
    { name: 'fuscia', color: '#eb37ce', fillColor: 'rgba(235, 55, 206, 0.25)' },
    {
        name: 'light purple',
        color: '#C792EA',
        fillColor: 'rgba(199, 146, 234, 0.25)',
    },
    {
        name: 'salmon',
        color: '#ec7f77',
        fillColor: 'rgba(236, 127, 119, 0.25)',
    },
    { name: 'olive', color: '#989801', fillColor: 'rgba(152, 152, 1, 0.25)' },
    { name: 'beige', color: '#ecd1af', fillColor: 'rgba(236, 209, 175, 0.25)' },
    { name: 'choco', color: '#b7652b', fillColor: 'rgba(183, 101, 43, 0.25)' },
];

// rgb for css vars - font
export const fontColor = {
    default: [69, 69, 69],
    dark: [239, 239, 239],
    lush: [255, 216, 137],
};

// rgb for css vars - accent
export const accentColor = {
    default: [133, 208, 206],
    dark: [52, 101, 127],
    lush: [245, 172, 114],
};

// rgb for css vars - bg
export const fillColor = {
    default: 'rgba(191,191,191, 0.1)',
    dark: 'rgba(144,144,144, 0.1)',
    lush: 'rgba(107,160,151, 0.1)',
};

export const backgroundColor = {
    default: 'rgba(255,255,255, 0.95)',
    dark: 'rgba(48,46,47, 0.95)',
    lush: 'rgba(51,79,74, 0.95)',
};

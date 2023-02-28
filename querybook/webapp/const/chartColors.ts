import colorPalette from 'config/color_palette.yaml';

export const ColorPalette = colorPalette;

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

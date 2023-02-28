import { memoize } from 'lodash';

import { ColorPalette } from 'const/chartColors';

const convertHexToRGB = (hexColor: string) => {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    return [r, g, b];
};

export const getClosestColor = memoize((hexColor: string) => {
    // Convert the hex color to RGB
    const givenColor = convertHexToRGB(hexColor);

    // Calculate the Euclidean distance between the given color and each color in the fixed set
    let minDistance = Infinity;
    let closestColor = null;
    for (const color of ColorPalette) {
        const paletteColor = convertHexToRGB(color.color);
        const distance =
            (givenColor[0] - paletteColor[0]) ** 2 +
            (givenColor[1] - paletteColor[1]) ** 2 +
            (givenColor[2] - paletteColor[2]) ** 2;
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
        }
    }

    return closestColor;
});

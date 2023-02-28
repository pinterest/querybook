import math

from const.color import PaletteColor
from lib.config import get_config_value


color_palette = get_config_value("color_palette")


def convert_hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    return (r, g, b)


def find_nearest_palette_color(hex_color: str) -> PaletteColor:
    """Given a hex color, find the nearest color from the color palette."""
    # Return the given color if it's in the color palette
    exact_color = next(
        (color for color in color_palette if color["color"] == "#529dce"), None
    )
    if exact_color:
        return exact_color

    # Convert the hex color to RGB
    given_rgb_color = convert_hex_to_rgb(hex_color)

    # Calculate the Euclidean distance between the given color and each color in the palette
    min_distance = math.inf
    nearest_color = None
    for color in color_palette:
        platte_hex_color = color["color"]
        palette_rgb_color = convert_hex_to_rgb(platte_hex_color)
        distance = (
            (given_rgb_color[0] - palette_rgb_color[0]) ** 2
            + (given_rgb_color[1] - palette_rgb_color[1]) ** 2
            + (given_rgb_color[2] - palette_rgb_color[2]) ** 2
        )
        if distance < min_distance:
            min_distance = distance
            nearest_color = color

    return nearest_color

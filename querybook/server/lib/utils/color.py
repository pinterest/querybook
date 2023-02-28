import math

from lib.config import get_config_value


color_palette = get_config_value("color_palette")


def convert_hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    return (r, g, b)


def closest_color(hex_color: str) -> str:
    """Given a hex color, find the closest color from the color palette."""
    # Return the given color if it's in the color palette
    if any(color["color"] == hex_color for color in color_palette):
        return hex_color

    # Convert the hex color to RGB
    given_rgb_color = convert_hex_to_rgb(hex_color)

    # Calculate the Euclidean distance between the given color and each color in the fixed set
    min_distance = math.inf
    closest_color = None
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
            closest_color = platte_hex_color

    return closest_color

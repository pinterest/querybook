from html import escape as htmlescape
import json
from bs4 import BeautifulSoup


def richtext_to_plaintext(text, default="", escape=False) -> str:
    is_draftjs, text = try_parse_draftjs(text or default)

    if not is_draftjs:
        text = html_to_plaintext(text)

    if escape:
        text = htmlescape(text)
    return text


def try_parse_draftjs(text) -> str:
    try:
        content_state = json.loads(text)
        return True, draftjs_content_state_to_plaintext(content_state)
    except json.decoder.JSONDecodeError:
        # For old text cells the value was plain text
        return False, text


def draftjs_content_state_to_plaintext(content_state) -> str:
    blocks = content_state.get("blocks", [])
    blocks_text = [block.get("text", "") for block in blocks]
    joined_blocks = "\n".join(blocks_text)
    return joined_blocks


def html_to_plaintext(html) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return soup.getText()

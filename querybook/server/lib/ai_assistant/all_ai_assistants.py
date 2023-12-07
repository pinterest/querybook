from lib.utils.import_helper import import_module_with_default

ALL_PLUGIN_AI_ASSISTANTS = import_module_with_default(
    "ai_assistant_plugin",
    "ALL_PLUGIN_AI_ASSISTANTS",
    default=[],
)

ALL_AI_ASSISTANTS = ALL_PLUGIN_AI_ASSISTANTS


def get_ai_assistant_class(name: str):
    for assistant in ALL_AI_ASSISTANTS:
        if assistant.name == name:
            return assistant
    raise ValueError(f"Unknown AI assistant name {name}")

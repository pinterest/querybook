from langchain.prompts import PromptTemplate


prompt_template = """
You are a helpful data scientist that can summarize the data doc.

I have querybook data doc with the following data cells. Generate a brief 10-word-maximum title that best summarize them for my document.

===Data Doc Cell Contents
{cell_contents}

===Response Format
Please respond in below JSON format:
{{
    "title": "This is a title"
}}
"""

DATA_DOC_TITLE_PROMPT = PromptTemplate.from_template(prompt_template)

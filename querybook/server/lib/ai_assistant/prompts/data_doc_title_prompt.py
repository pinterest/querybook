from langchain.prompts import PromptTemplate


prompt_template = """
You are a helpful data scientist that can summarize the data analysis documents.

I have a SQL analysis doc which we call "DataDoc". Generate a brief 10-word-maximum title that best summarize them for my document based on the contents.
If the contents are empty, just generate a title that is "Empty DataDoc".

===Contents
{cell_contents}

===Response Format
Please respond in below JSON format:
{{
    "title": "This is a title"
}}
"""

DATA_DOC_TITLE_PROMPT = PromptTemplate.from_template(prompt_template)

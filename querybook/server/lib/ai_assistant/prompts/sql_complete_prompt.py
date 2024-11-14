from langchain.prompts import PromptTemplate

prompt_template = """You are an expert in the {dialect} SQL dialect, skilled in providing precise SQL code completions.  
Your task is to complete the SQL query based on the given context.  
  
<Prefix><FILL_ME><Suffix>  

===Table Schemas  
{table_schemas}  
  
===Response Guidelines:  
1. Analyze the partial query and table schemas to understand the context and determine the query's goal.  
2. Identify the relevant tables and columns necessary for the query.  
3. Replace <FILL_ME> with appropriate SQL code, or leave it empty if no completion is needed.  
4. Make sure the completion does not overlap with the prefix or suffix.
5. Respond in JSON format
  
===Response Format:  
{{  
    "completion": "the SQL code to replace <FILL_ME>, if any"
}} 


===Example
Input:
sele<FILL_ME> from some_table 

Reasoning:
The prefix "sele" suggests that the query is likely a SELECT statement. The table schemas indicate the available columns. The completion should be a list of columns to select from the table "some_table".
As it already has a partial query, the completion should be starting from "ct" to complete the word "select", and then followed by the columns to select.

Output:
{{
    "completion": "ct *"
}}

===Input
{prefix}<FILL_ME>{suffix} 

"""


SQL_AUTOCOMPLETE_PROMPT = PromptTemplate.from_template(prompt_template)

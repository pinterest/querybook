from app.db import with_session

import openai

# Set up the OpenAI API client
openai.api_key = "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"


@with_session
def get_sql_to_text(sql, session=None):
    prompt = (
            "The following is a conversation between an AI assistant and a human:\n\n"
            "Human: Can you help me translate SQL query to text?\n"
            "AI: Sure\n"
            "Human:" + sql +
            "AI:"
    )
    print(prompt)
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        max_tokens=1024,
        n=1,
        stop=None,
        temperature=0.1,
    )
    print(response.choices)
    text = response.choices[0].text.strip()
    print(text)
    return text

@with_session
def get_text_to_sql(text, tables, session=None):
    prompt = (
            "The following is a conversation between an AI assistant and a human:\n\n"
            "Human: Help me write a SQL query for the following question: " + text + "\n"
            "AI: Sure, what are the tables to choose from?\n"
            "Human:" + tables + "\n" 
            "HUman: Make sure you only output the sql query.\n"
            "AI:"
    )
    print(prompt)
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        max_tokens=1024,
        n=1,
        stop=None,
        temperature=0.1,
    )
    print(response.choices)
    sql = response.choices[0].text.strip()
    print(sql)
    return sql

@with_session
def recommend_tables(question, session=None):
    top_table_list = ['experiment.experiment_users_join_date', 'default.unique_actions',
                      'ad.ad_all_event' 'data.users_d', 'default.user_states_sa',
                      'default.xd28_users_sa',  'default.xd7_users_sa',
                      'experiment.experiment_users', 'data.feedview_log', 'default.context_logs',  'shopping.feedview_log_flat', 'bi.dates',
                      'bi.pinner_pin_activity_stats',  'catalogs.merchants', 'bi.bi_daily_table_availability',
                      'data.boards_d', 'data.pins_d', 'default.unique_app_events']
    prompt = (
            "The following is a conversation between an AI assistant and a human:\n\n"
            "Human: I want to write a SQL query against tables. Can you help me find the top 3 tables to use among the following tables:" + ','.join(top_table_list) + "\n"
            "AI: Sure, what is the analytical question?\n"
            "Human:" + question + "\n"
            "Human: Make sure you limit the number of tables to be less than three.\n"
            "AI:"
    )
    print(prompt)
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        max_tokens=512,
        n=1,
        stop=None,
        temperature=0.1,
    )
    print(response.choices)
    text = response.choices[0].text.strip()
    print(text)
    return text
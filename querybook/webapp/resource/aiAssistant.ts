import ds from 'lib/datasource';
import {IChangeLogItem} from "../const/changeLog";

export const AIAssistantResource = {
     translateSQL2Text: (query: string) => {
         const params = {};
         params['query'] = query
         return ds.fetch<string>(`/ai_assistant/sql2text/`, params)
     },

     translateText2SQL: (text: string, tables: string) => {
         const params = {
             'text': text,
             'tables': tables
         };
         return ds.fetch<string>(`/ai_assistant/text2sql/`, params)
     },

     recommendTableToUse: (question: string) => {
         const params = {'question': question};
         return ds.fetch<string>(`/ai_assistant/recommend_tables/`, params)
     }
};

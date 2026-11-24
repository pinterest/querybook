"""
AWS Bedrock AI Assistant Plugin for Querybook

This plugin provides integration with AWS Bedrock's Claude models for AI-powered
SQL assistance in Querybook.

Requirements:
- boto3 library
- AWS credentials configured (via AWS CLI, IAM roles, or environment variables)
- Access to AWS Bedrock Claude models

Configuration:
Add to your querybook config:
AI_ASSISTANT_PROVIDER: bedrock
AI_ASSISTANT_CONFIG:
    default:
        model_args:
            model_name: "us.anthropic.claude-3-5-sonnet-20241022-v2:0"  # or any supported Claude model
            region: "us-east-1"
            temperature: 0.0
            max_tokens: 4096
            streaming: false
            profile_name: "default"  # optional, defaults to default AWS profile
"""

import boto3
import json
from typing import Iterator, Optional

try:
    from app.flask_app import socketio
    from const.ai_assistant import AI_ASSISTANT_NAMESPACE
    SOCKETIO_AVAILABLE = True
except ImportError:
    SOCKETIO_AVAILABLE = False


class BedrockAssistant:
    """AWS Bedrock AI Assistant for Querybook"""
    
    name = "bedrock"
    _config = {}
    
    @classmethod
    def set_config(cls, config):
        """Set configuration for the Bedrock assistant"""
        cls._config = config
    
    @classmethod
    def get_assistant(cls, assistant_type="default"):
        """Get an instance of the Bedrock assistant"""
        return cls()
    
    def __init__(self):
        """Initialize the Bedrock assistant with configuration"""
        config = self.__class__._config
        assistant_config = config.get("default", {})
        model_args = assistant_config.get("model_args", {})
        
        # Model configuration
        self.model_name = model_args.get("model_name", "us.anthropic.claude-3-5-sonnet-20241022-v2:0")
        self.region = model_args.get("region", "us-east-1")
        self.temperature = model_args.get("temperature", 0.0)
        self.max_tokens = model_args.get("max_tokens", 4096)
        self.streaming = model_args.get("streaming", False)
        
        # AWS session configuration
        profile_name = model_args.get("profile_name", "default")
        session = boto3.Session(profile_name=profile_name)
        self.bedrock_runtime = session.client(
            service_name="bedrock-runtime",
            region_name=self.region
        )

    def _format_messages(self, messages):
        """Format messages for Claude API"""
        formatted_messages = []
        system_message = None
        
        for message in messages:
            role = message.get("role")
            content = message.get("content", "")
            
            if role == "system":
                system_message = content
            elif role in ["user", "assistant"]:
                formatted_messages.append({
                    "role": role,
                    "content": content
                })
        
        return formatted_messages, system_message

    def _create_request_body(self, messages, **kwargs):
        """Create request body for Bedrock API"""
        formatted_messages, system_message = self._format_messages(messages)
        
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "messages": formatted_messages,
            "max_tokens": kwargs.get("max_tokens", self.max_tokens),
            "temperature": kwargs.get("temperature", self.temperature),
        }
        
        if system_message:
            body["system"] = system_message
            
        return json.dumps(body)

    def _clean_response(self, response_text):
        """Clean response text by removing extra quotes and markdown code blocks"""
        # Remove outer quotes
        if response_text.startswith('"') and response_text.endswith('"'):
            response_text = response_text[1:-1]
        
        # Handle markdown code blocks
        if '```sql' in response_text:
            # Extract content between ```sql and ```
            start = response_text.find('```sql') + 6
            end = response_text.find('```', start)
            if end != -1:
                response_text = response_text[start:end].strip()
        elif response_text.startswith('```') and response_text.endswith('```'):
            # Remove surrounding code blocks
            response_text = response_text[3:-3].strip()
        
        # Remove common prefixes from explanatory responses
        lines = response_text.split('\n')
        if lines and any(phrase in lines[0].lower() for phrase in ['here', 'modified', 'updated', 'changed']):
            # Skip the first explanatory line
            response_text = '\n'.join(lines[1:]).strip()
        
        return response_text.strip()

    def _emit_websocket_response(self, event_name, data, error=None):
        """Emit WebSocket response if available"""
        if not SOCKETIO_AVAILABLE:
            return
            
        try:
            if error:
                socketio.emit(
                    event_name,
                    ("error", str(error)),
                    namespace=AI_ASSISTANT_NAMESPACE
                )
            else:
                socketio.emit(
                    event_name,
                    ("data", data),
                    namespace=AI_ASSISTANT_NAMESPACE
                )
                socketio.emit(
                    event_name,
                    ("close", {}),
                    namespace=AI_ASSISTANT_NAMESPACE
                )
        except Exception as e:
            print(f"WebSocket emission error: {e}")

    def get_response(self, messages, **kwargs) -> str:
        """Get non-streaming response from Bedrock"""
        body = self._create_request_body(messages, **kwargs)
        
        response = self.bedrock_runtime.invoke_model(
            modelId=self.model_name,
            body=body,
            contentType="application/json",
            accept="application/json"
        )
        
        response_body = json.loads(response["body"].read())
        return response_body["content"][0]["text"]

    def get_response_stream(self, messages, **kwargs) -> Iterator[str]:
        """Get streaming response from Bedrock"""
        body = self._create_request_body(messages, **kwargs)
        
        response = self.bedrock_runtime.invoke_model_with_response_stream(
            modelId=self.model_name,
            body=body,
            contentType="application/json",
            accept="application/json"
        )
        
        for event in response["body"]:
            chunk = json.loads(event["chunk"]["bytes"])
            
            if chunk["type"] == "content_block_delta":
                if "text" in chunk["delta"]:
                    yield chunk["delta"]["text"]
            elif chunk["type"] == "message_stop":
                break

    def get_ai_response(self, messages, **kwargs):
        """Main method called by Querybook for AI responses"""
        if self.streaming and kwargs.get("streaming", True):
            return self.get_response_stream(messages, **kwargs)
        else:
            return self.get_response(messages, **kwargs)

    # WebSocket handler methods for Querybook AI Assistant integration
    def _clean_response(self, response_text):
        """Simple response cleaning - remove quotes and basic markdown"""
        if response_text.startswith('"') and response_text.endswith('"'):
            response_text = response_text[1:-1]
        
        # Only handle clear markdown code blocks
        if response_text.startswith('```sql\n') and response_text.endswith('\n```'):
            response_text = response_text[6:-4]
        elif response_text.startswith('```\n') and response_text.endswith('\n```'):
            response_text = response_text[4:-4]
            
        return response_text.strip()

    # WebSocket handler methods for Querybook AI Assistant integration
    def generate_title_from_query(self, query, **kwargs):
        """Generate title from SQL query"""
        try:
            messages = [
                {
                    "role": "system", 
                    "content": "You are a SQL expert. Generate only short, descriptive titles for SQL queries. Return only the title text, nothing else."
                },
                {
                    "role": "user", 
                    "content": f"Title for this SQL query:\n\n{query}"
                }
            ]
            result = self.get_response(messages, **kwargs)
            result = self._clean_response(result)
            
            self._emit_websocket_response("sql_title", {"title": result})
            return result
        except Exception as e:
            print(f"Error in generate_title_from_query: {e}")
            self._emit_websocket_response("sql_title", None, error=e)
            return str(e)

    def generate_sql_query(self, query_engine_id, tables, question, original_query="", **kwargs):
        """Generate SQL from natural language"""
        try:
            context = f"Available tables: {', '.join(tables)}\n" if tables else ""
            if original_query:
                context += f"Modify this existing query: {original_query}\n"
            
            messages = [
                {
                    "role": "system",
                    "content": "You are a SQL expert. Convert natural language to SQL queries. Return ONLY the SQL query, no explanations, no markdown, no additional text."
                },
                {
                    "role": "user",
                    "content": f"{context}Request: {question}"
                }
            ]
            result = self.get_response(messages, **kwargs)
            result = self._clean_response(result)
            
            self._emit_websocket_response("text_to_sql", {"query": result})
            return result
        except Exception as e:
            print(f"Error in generate_sql_query: {e}")
            self._emit_websocket_response("text_to_sql", None, error=e)
            return str(e)

    def query_auto_fix(self, query_execution_id, **kwargs):
        """Fix SQL query based on error"""
        try:
            messages = [
                {
                    "role": "system",
                    "content": "You are a SQL expert. Fix SQL query errors. Return ONLY the corrected SQL query, no explanations."
                },
                {
                    "role": "user",
                    "content": "Fix this SQL query error."
                }
            ]
            result = self.get_response(messages, **kwargs)
            result = self._clean_response(result)
            
            self._emit_websocket_response("sql_fix", {"query": result})
            return result
        except Exception as e:
            print(f"Error in query_auto_fix: {e}")
            self._emit_websocket_response("sql_fix", None, error=e)
            return str(e)

    def get_sql_completion(self, query_engine_id, tables, prefix, suffix, **kwargs):
        """Get SQL completion"""
        try:
            context = f"Available tables: {', '.join(tables)}\n" if tables else ""
            messages = [
                {
                    "role": "system",
                    "content": "You are a SQL expert. Complete partial SQL queries. Return ONLY the complete SQL query, no explanations."
                },
                {
                    "role": "user",
                    "content": f"{context}Complete this SQL:\nBefore cursor: {prefix}\nAfter cursor: {suffix}"
                }
            ]
            result = self.get_response(messages, **kwargs)
            result = self._clean_response(result)
            
            self._emit_websocket_response("sql_complete", {"completion": result})
            return result
        except Exception as e:
            print(f"Error in get_sql_completion: {e}")
            self._emit_websocket_response("sql_complete", None, error=e)
            return str(e)


# Export for Querybook plugin system
ALL_PLUGIN_AI_ASSISTANTS = [BedrockAssistant]

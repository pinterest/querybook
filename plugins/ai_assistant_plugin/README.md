# AWS Bedrock AI Assistant Plugin for Querybook

This plugin integrates AWS Bedrock's Claude models with Querybook's AI Assistant functionality, providing intelligent SQL assistance powered by Claude.

## Features

- **SQL Title Generation**: Generate descriptive titles for SQL queries
- **Text-to-SQL**: Convert natural language questions to SQL queries
- **Query Modification**: Modify existing queries based on natural language instructions
- **SQL Auto-fix**: Get suggestions for fixing SQL errors
- **SQL Completion**: Auto-complete partial SQL queries

## Requirements

- `boto3` Python library (included in `requirements/ai/bedrock.txt`)
- AWS credentials configured (via AWS CLI, IAM roles, or environment variables)
- Access to AWS Bedrock Claude models in your AWS account

## Installation

### For Production Docker Images

The dependencies are automatically included when building with `requirements/extra.txt`.

### For Development

1. Install boto3:
```bash
pip install -r requirements/ai/bedrock.txt
```

2. Configure AWS credentials using one of these methods:
   - AWS CLI: `aws configure`
   - Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - IAM roles (recommended for EC2/ECS deployments)
   - AWS profiles in `~/.aws/credentials`

3. Ensure you have access to Bedrock Claude models in your AWS account

## Configuration

Add the following to your Querybook configuration:

```yaml
AI_ASSISTANT_PROVIDER: bedrock
AI_ASSISTANT_CONFIG:
    default:
        model_args:
            model_name: "us.anthropic.claude-3-5-sonnet-20241022-v2:0"  # or any supported Claude model
            region: "us-east-1"  # AWS region where Bedrock is available
            temperature: 0.0  # Controls randomness (0.0 = deterministic)
            max_tokens: 4096  # Maximum tokens in response
            streaming: false  # Set to true for streaming responses
            profile_name: "default"  # Optional: AWS profile name
```

### Supported Claude Models

- `anthropic.claude-3-haiku-20240307-v1:0` (fastest, most cost-effective)
- `anthropic.claude-3-sonnet-20240229-v1:0` (balanced performance)
- `anthropic.claude-3-5-sonnet-20241022-v2:0` (recommended)
- `anthropic.claude-3-opus-20240229-v1:0` (most capable)
- `us.anthropic.claude-3-5-sonnet-20241022-v2:0` (inference profile)

For Claude 4 models, use inference profiles:
- `us.anthropic.claude-opus-4-1-20250805-v1:0`

## Usage

1. Enable AI Assistant in your Querybook public config:
```yaml
ai_assistant:
    enabled: true
    query_title_generation:
        enabled: true
    query_generation:
        enabled: true
    query_auto_fix:
        enabled: true
    sql_complete:
        enabled: true
```

2. Restart your Querybook containers

3. In the Querybook UI, you'll see AI Assistant options:
   - ✨ Sparkle icon in query cells for title generation
   - AI Assistant panel for query generation and modification
   - Auto-fix suggestions for query errors

## AWS Permissions

Your AWS credentials need the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
            ]
        }
    ]
}
```

## Troubleshooting

### Common Issues

1. **"No module named 'boto3'"**
   - Install boto3: `pip install -r requirements/ai/bedrock.txt`

2. **"Unable to locate credentials"**
   - Configure AWS credentials using `aws configure` or environment variables

3. **"Access denied to model"**
   - Ensure you have Bedrock permissions and model access in your AWS account
   - Check that the model is available in your specified region

4. **"Model not found"**
   - Verify the model name is correct and available in your region
   - Some models require requesting access in the AWS Bedrock console

### Debug Mode

Enable debug logging by setting the log level in your Querybook configuration:

```yaml
LOGGING_CONFIG:
    loggers:
        ai_assistant_plugin:
            level: DEBUG
```

## Contributing

This plugin is designed to be contributed back to the Querybook open source project. It follows Querybook's plugin architecture and doesn't modify core functionality.

## License

This plugin follows the same license as Querybook (Apache 2.0).

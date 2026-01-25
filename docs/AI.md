# AI Integration Guide

Ghost Writer leverages AI for several key features, including dynamic story generation and intelligent word moderation. This guide explains how these features work and how you can configure them.

## 🤖 Story Generation

Instead of relying on static, hardcoded templates, Ghost Writer uses OpenAI's `gpt-4o-mini` to generate unique "Mad Libs" style stories on demand.

### How it Works
1.  A user selects a story category (e.g., "Adventure", "Sci-Fi").
2.  The frontend calls the `/api/generate-story` API route.
3.  The API route, using the `ai-service.ts` library, sends a request to the OpenAI API with a prompt tailored to the selected category.
4.  The AI returns a story template with placeholders (e.g., `[noun]`, `[verb]`).
5.  The story is then ready for the community to contribute words.

### Tuning the AI

You can fine-tune the AI's story generation by setting the following environment variables:

- **`OPENAI_MODEL`**: The OpenAI model to use. Defaults to `gpt-4o-mini`.
- **`OPENAI_TEMPERATURE`**: The sampling temperature for the AI model. A higher value (e.g., `0.9`) will result in more creative and random stories, while a lower value will be more deterministic. Defaults to `0.9`.
- **`OPENAI_MAX_TOKENS`**: The maximum number of tokens (roughly, words) to generate for a story. Defaults to `700`.
- **`OPENAI_TIMEOUT_MS`**: The timeout in milliseconds for AI requests. Defaults to `10000`.
- **`AI_STORY_SYSTEM_PROMPT_APPEND`**: Text to append to the system prompt sent to the AI. This is useful for providing global style instructions (e.g., "All stories should be G-rated and suitable for all ages.").

### Fallback Mechanism
If an `OPENAI_API_KEY` is not provided, the application will fall back to using a set of static story templates. This ensures that the application remains functional even without an AI provider.

### Admin Instructions
Admins can use the admin dashboard to preview story generation with different parameters and to manage any "extra instructions" that are appended to the AI prompts. This allows for real-time experimentation without needing to change environment variables.

## 🛡️ Word Moderation

To ensure a safe and positive environment, Ghost Writer includes an AI-powered word moderation system. See [MODERATION.md](MODERATION.md) for more details.

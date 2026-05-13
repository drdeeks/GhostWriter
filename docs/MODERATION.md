# Word Moderation Guide

Ghost Writer employs an intelligent word moderation system to maintain a safe and positive environment for all users. This guide explains how the moderation system works, its fallback mechanisms, and how to test it.

## 🛡️ How it Works

1.  When a user contributes a word, the frontend sends it to the `/api/moderate-word` API route before submitting it to the smart contract.
2.  This API route uses the OpenAI Moderation endpoint to check the word against a variety of categories, including:
    - Hate speech
    - Self-harm
    - Sexual content
    - Violence
3.  If the word is flagged in any of these categories, the API will return an error, and the word will not be accepted.

### Consolidation through `aiService`
For consistency and to centralize fallback and caching logic, the `/api/moderate-word` route uses the `aiService.moderateWord()` method. This ensures that all AI-powered moderation follows the same set of rules and performance optimizations.

##  fallback Mechanism

If an `OPENAI_API_KEY` is not provided, or if the OpenAI API is unavailable, the moderation system will fall back to a basic profanity filter. This filter uses a blocklist of common inappropriate words. While not as sophisticated as the AI-powered moderation, it provides a baseline level of protection.

## 🧪 How to Test

You can test the moderation system by attempting to contribute words that are likely to be flagged by the OpenAI Moderation endpoint.

1.  Run the application locally.
2.  Open a story and attempt to contribute a word that falls into one of the moderated categories.
3.  The application should display an error message and prevent the contribution.

To test the fallback mechanism:
1.  Temporarily remove the `OPENAI_API_KEY` from your `.env` file.
2.  Restart the application.
3.  Attempt to contribute a word from the basic profanity blocklist.
4.  The application should reject the word.

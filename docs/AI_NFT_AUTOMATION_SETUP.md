# GhostWriter: AI & NFT Automation Setup Guide

This guide will walk you through setting up AI moderation, AI story population, and NFT auto-generation for GhostWriter. Each section is step-by-step and beginner-friendly.

---

## 1. AI Moderation for Word Submissions

### Overview
AI moderation ensures that user-submitted words are safe, appropriate, and fit community guidelines.

### Prerequisites
- An account with an AI moderation provider (e.g., OpenAI, Google Perspective API)
- API key for the moderation service

### Steps
1. **Register for a Moderation API**
   - [OpenAI Moderation](https://platform.openai.com/docs/guides/moderation)
   - [Google Perspective API](https://perspectiveapi.com/)
   - Follow their instructions to get your API key.

2. **Add API Key to Environment**
   - Add your key to `.env`:
     ```env
     MODERATION_API_KEY=your_key_here
     ```

3. **Create Moderation Utility**
   - Create `src/lib/moderation.ts`:
     ```ts
     export async function moderateWord(word: string): Promise<boolean> {
       // Example: OpenAI Moderation
       const res = await fetch('https://api.openai.com/v1/moderations', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${process.env.MODERATION_API_KEY}`
         },
         body: JSON.stringify({ input: word })
       });
       const data = await res.json();
       return !data.results[0].flagged; // true if safe
     }
     ```

4. **Integrate Moderation in Submission Flow**
   - In `contribution-modal.tsx`, before accepting a word, call `moderateWord(word)`.
   - If flagged, show an error and block submission.

5. **Test & Calibrate**
   - Try submitting various words.
   - Adjust error messages and moderation thresholds as needed.

---

## 2. AI Story Population (Template Generation)

### Overview
Use AI to generate new story templates or fill in story slots.

### Prerequisites
- An account with an AI text generation provider (e.g., OpenAI GPT-4, Anthropic)
- API key for the text generation service

### Steps
1. **Register for a Text Generation API**
   - [OpenAI GPT-4](https://platform.openai.com/docs/guides/gpt)
   - [Anthropic](https://www.anthropic.com/)
   - Get your API key.

2. **Add API Key to Environment**
   - Add your key to `.env`:
     ```env
     AI_STORY_API_KEY=your_key_here
     ```

3. **Create Story Generation Utility**
   - Create `src/lib/aiStoryGenerator.ts`:
     ```ts
     export async function generateStoryTemplate(prompt: string): Promise<string> {
       const res = await fetch('https://api.openai.com/v1/chat/completions', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${process.env.AI_STORY_API_KEY}`
         },
         body: JSON.stringify({
           model: 'gpt-4',
           messages: [{ role: 'user', content: prompt }],
           max_tokens: 200,
           temperature: 0.8
         })
       });
       const data = await res.json();
       return data.choices[0].message.content.trim();
     }
     ```

4. **Integrate in Admin Dashboard or Story Creation**
   - Add a button to auto-generate a template using `generateStoryTemplate()`.
   - Example prompt: "Write a family-friendly story template with 10 [WORD_TYPE] blanks."

5. **Test & Calibrate**
   - Try generating templates for different categories.
   - Refine prompts for style, length, and appropriateness.

---

## 3. NFT Auto-Generation (Image & Metadata)

### Overview
Automatically generate NFT images and metadata when a story is completed.

### Prerequisites
- Image generation API (e.g., DALL·E, Stable Diffusion, or custom Node.js service)
- IPFS pinning service (e.g., Pinata)
- API keys for both

### Steps
1. **Register for Image Generation & IPFS**
   - [DALL·E](https://platform.openai.com/docs/guides/images)
   - [Stable Diffusion](https://stability.ai/)
   - [Pinata](https://www.pinata.cloud/)
   - Get your API keys.

2. **Add API Keys to Environment**
   - Add to `.env`:
     ```env
     IMAGE_API_KEY=your_key_here
     PINATA_API_KEY=your_key_here
     PINATA_SECRET=your_secret_here
     ```

3. **Create Image Generation Utility**
   - Create `src/lib/imageGenerator.ts`:
     ```ts
     export async function generateImage(prompt: string): Promise<string> {
       // Example: DALL·E
       const res = await fetch('https://api.openai.com/v1/images/generations', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${process.env.IMAGE_API_KEY}`
         },
         body: JSON.stringify({ prompt, n: 1, size: '1024x1024' })
       });
       const data = await res.json();
       return data.data[0].url; // URL to generated image
     }
     ```

4. **Upload to IPFS**
   - Use Pinata SDK or API to upload the image and metadata.
   - Example: [Pinata Docs](https://docs.pinata.cloud/)

5. **Integrate with NFT Metadata Generation**
   - In `api/nft/[tokenId]/route.ts`, after story completion, call image and metadata generation utilities.
   - Update the NFT metadata URI to point to the new IPFS hash.

6. **Test & Calibrate**
   - Complete a story and verify the NFT image and metadata are generated and pinned.
   - Adjust prompts and metadata structure as needed.

---

## Troubleshooting & Tips
- **API Limits:** Watch for rate limits and quota errors.
- **Security:** Never commit API keys to public repos.
- **Testing:** Use testnets and dummy data before mainnet.
- **Prompt Engineering:** Small changes in prompts can greatly affect AI output.
- **Community Feedback:** Calibrate moderation and generation based on real user feedback.

---

## Resources
- [OpenAI Docs](https://platform.openai.com/docs)
- [Perspective API Docs](https://developers.perspectiveapi.com/)
- [Pinata Docs](https://docs.pinata.cloud/)
- [Stability AI Docs](https://platform.stability.ai/docs/api)

---

**You’re ready to automate GhostWriter with AI and NFT magic!**

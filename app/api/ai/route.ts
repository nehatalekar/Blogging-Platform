import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { withErrorHandling, APIError } from "@/lib/api-error";

const SYSTEM_PROMPT =
  "You are a professional blog writing assistant. Always respond with valid JSON only — no markdown, no code fences, no extra text.";

type AIInput = {
  prompt?: string;
  title?: string;
  description?: string;
  content?: string;
};

const buildPrompt: Record<string, (input: AIInput) => string> = {
  draft: ({ prompt }) =>
    `Generate a complete blog post draft for the topic: "${prompt}".
Return JSON with exactly these keys: { "title": "...", "description": "...", "content": "...", "tag": "..." }
- title: catchy, SEO-friendly, max 100 characters
- description: compelling 1-2 sentence summary, max 200 characters
- content: full blog post in HTML using <h2>, <p>, <ul>, <li>, <strong> tags, at least 400 words
- tag: single relevant category (e.g. Technology, Business, Health, Lifestyle, Education, Travel)`,

  "regenerate-title": ({ title, description, content }) =>
    `Suggest a better title for this blog post.
Current title: "${title}"
Description: "${description}"
Content preview: "${(content ?? "").replace(/<[^>]*>/g, "").slice(0, 300)}"
Return JSON with exactly this key: { "title": "..." }
- Make it catchy, SEO-friendly, max 100 characters`,

  "regenerate-description": ({ title, description, content }) =>
    `Write a better description and suggest a tag for this blog post.
Title: "${title}"
Current description: "${description}"
Content preview: "${(content ?? "").replace(/<[^>]*>/g, "").slice(0, 300)}"
Return JSON with exactly these keys: { "description": "...", "tag": "..." }
- description: compelling 1-2 sentence summary, max 200 characters
- tag: single relevant category`,

  "improve-content": ({ title, content }) =>
    `Improve and enhance this blog post content. Preserve all HTML tags exactly.
Title: "${title}"
Content: ${content}
Return JSON with exactly this key: { "content": "..." }
- Improve clarity, flow, and engagement
- Fix grammar and style issues
- Keep every HTML tag intact
- Do not change the overall topic or message`,
};

export const POST = withErrorHandling(async (req: Request) => {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) throw new APIError(401, "Unauthorized");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new APIError(500, "AI service is not configured");

  const body = await req.json();
  const { mode, prompt, title, description, content } = body as AIInput & { mode: string };

  if (!mode || !buildPrompt[mode]) throw new APIError(400, `Invalid mode: "${mode}"`);

  const userPrompt = buildPrompt[mode]({ prompt, title, description, content });

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!openaiRes.ok) {
    const errBody = await openaiRes.json().catch(() => ({}));
    throw new APIError(502, (errBody as any)?.error?.message ?? "AI service error");
  }

  const openaiData = await openaiRes.json();
  const text: string | undefined = openaiData.choices?.[0]?.message?.content;
  if (!text) throw new APIError(502, "Empty response from AI service");

  let result: Record<string, string>;
  try {
    result = JSON.parse(text);
  } catch {
    throw new APIError(502, "AI returned invalid JSON");
  }

  return NextResponse.json(result);
});

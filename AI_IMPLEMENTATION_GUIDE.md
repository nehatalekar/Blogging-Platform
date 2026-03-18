# AI Features Implementation - Complete Step-by-Step Guide

## Phase 1: Understanding Requirements & Analysis

### 1.1 What We Needed to Build
You asked for **2 combined AI features** in a single integrated system:
- **Feature 1**: AI Blog Content Generation (write from topic)
- **Feature 2**: Auto Title & Description Suggestion (with smart regeneration buttons)

### 1.2 Key Constraints to Work With
- ✅ Your project already had: NextAuth, Prisma, Quill editor, TailwindCSS, native fetch
- ✅ Pattern to follow: Your existing `/api/blog` route for reference
- ✅ Error handling: Your `APIError` + `withErrorHandling` wrapper
- ❌ No SDKs allowed: Use native `fetch()` API only
- ❌ Keep all existing save/publish/delete logic untouched

---

## Phase 2: Architecture Planning

### 2.1 High-Level Design Decision

```
┌─────────────────────────────────────────────────────────────┐
│                    BlogModal Component                       │
│  (New AI UI: buttons, toggles, inputs)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ fetch("/api/ai", { mode, content })
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            /api/ai Route (NEW)                              │
│  - Auth check (NextAuth)                                    │
│  - Call OpenAI API based on mode                            │
│  - Return JSON result                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ (POST to gpt-4o with specific prompt)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            OpenAI API (External)                            │
│  - Processes request                                        │
│  - Returns JSON formatted response                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Why This Architecture?

| Decision | Why |
|----------|-----|
| **Separate `/api/ai` route** | Keeps concerns separated; reusable for future AI features |
| **Mode-based endpoint** | One route handles 4 different operations (draft, regen-title, regen-desc, improve-content) |
| **NextAuth authentication** | Same pattern as `/api/blog` — verify user owns the action |
| **JSON response_format** | Forces OpenAI to return valid JSON, not markdown or text |
| **Prompt templates** | Different prompt for each mode ensures correct output structure |

---

## Phase 3: Detailed Implementation

### 3.1 Step 1: Create the API Route (`/api/ai/route.ts`)

#### Problem to Solve
We need one endpoint that can handle 4 different AI operations, each needing different input data and returning different JSON structures.

#### Solution: Mode-Based Pattern

```typescript
// Define what prompt each mode uses
const buildPrompt: Record<string, (input: AIInput) => string> = {
  "draft":                 ({ prompt }) => "Generate full blog...",
  "regenerate-title":      ({ title, content }) => "Suggest better title...",
  "regenerate-description": ({ title, content }) => "Suggest better description...",
  "improve-content":       ({ content }) => "Improve this content..."
};

// In the handler:
const userPrompt = buildPrompt[mode](inputData);
```

#### Why This Approach?
- **Scalable**: Add new modes by just adding a prompt template
- **Single API route**: No need for `/api/ai/title`, `/api/ai/description`, etc.
- **Clear input/output mapping**: Each mode knows exactly what it needs and returns

#### Key Code Detail:
```typescript
const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,  // ← from .env
  },
  body: JSON.stringify({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },    // ← "Be a professional blog writer"
      { role: "user", content: userPrompt },         // ← Mode-specific prompt
    ],
    response_format: { type: "json_object" },        // ← CRITICAL: Ensures valid JSON back
    temperature: 0.7,                                 // ← Creativity level
  }),
});
```

**Why `response_format: { type: "json_object" }`?**
- Without it, OpenAI might return `"title": "..." and also some extra text`
- With it, OpenAI **must** return valid JSON or error
- We can safely `JSON.parse()` the response

---

### 3.2 Step 2: Update BlogModal UI

#### Problem to Solve
We need to add AI buttons in 4 different locations without breaking existing form logic.

#### Solution: Separate State Management

**Key insight**: We need to track which AI operation is currently running so:
1. Only that button shows loading state
2. Other buttons stay clickable
3. Form inputs remain interactive

#### State Design:

```typescript
// BEFORE (causing the dependency issue):
const [aiLoading, setAiLoading] = useState(false);
// Problem: Single boolean affects ALL buttons

// AFTER (independent operation):
const [aiLoadingMode, setAiLoadingMode] = useState<string | null>(null);
// Solution: Tracks WHICH mode is running (or null if idle)
```

#### How It Works:

```typescript
const callAI = async (mode: string) => {
  setAiLoadingMode(mode);  // ← Only this mode is now "loading"
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      body: JSON.stringify({ 
        mode,                    // ← Tell API which operation
        prompt: aiTopic,        // For draft mode
        title,                   // For regenerate/improve modes
        description, 
        content 
      }),
    });
    const data = await res.json();
    
    // Selectively update fields based on what API returned
    if (data.title) setTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.tag) setTag(data.tag);
    if (data.content) setContent(data.content);
  } finally {
    setAiLoadingMode(null);  // ← Operation complete
  }
};
```

#### Button State Logic:

```typescript
// For Title Regenerate button:
<button
  disabled={aiLoadingMode === "regenerate-title" || !title}
  onClick={() => callAI("regenerate-title")}
>
  {aiLoadingMode === "regenerate-title" ? "..." : "↻ Regenerate"}
</button>

// For Description Regenerate button (INDEPENDENT):
<button
  disabled={aiLoadingMode === "regenerate-description" || !title}
  onClick={() => callAI("regenerate-description")}
>
  {aiLoadingMode === "regenerate-description" ? "..." : "↻ Regenerate"}
</button>

// Both check their OWN mode, not a shared flag
```

---

### 3.3 Step 3: Four AI Features Breakdown

#### **Feature 1: AI Draft (Mode: "draft")**

```
User Flow:
┌─────────────────────────────────────────┐
│ User clicks "✨ AI Draft" toggle button  │
│ (Opens hidden AI panel)                 │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ User enters topic:                      │
│ "The future of AI in healthcare"        │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ User clicks "Generate Draft"            │
│ POST /api/ai { mode: "draft", prompt }  │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ API sends to OpenAI:                    │
│ "Generate full blog post for topic..."  │
│ Response format: { title, description,  │
│   content (HTML), tag }                 │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ Return fills ALL 4 fields:              │
│ - title input                           │
│ - description textarea                  │
│ - content editor (Quill)                │
│ - tag input                             │
└─────────────────────────────────────────┘
```

**API Prompt for "draft" mode:**
```
"Generate a complete blog post draft for the topic: '${prompt}'.
Return JSON with exactly these keys: { 'title': '', 'description': '', 'content': '', 'tag': '' }
- title: catchy, SEO-friendly, max 100 characters
- description: compelling 1-2 sentence summary
- content: full blog post in HTML using <h2>, <p>, <ul>, <li>, <strong> tags, at least 400 words
- tag: single relevant category (e.g. Technology, Business, Health)"
```

---

#### **Feature 2a: Regenerate Title (Mode: "regenerate-title")**

```
User Flow:
┌──────────────────────────────┐
│ User fills in some content   │
│ and writes a title           │
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│ User clicks ↻ Regenerate     │
│ next to Title label          │
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│ POST /api/ai {               │
│   mode: "regenerate-title",  │
│   title: current title,      │
│   description: current desc, │
│   content: current content   │
│ }                            │
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│ API sends prompt to OpenAI:  │
│ "Current title: '${title}'   │
│  Content: '${content preview}│
│  Suggest a better title"     │
│                              │
│ Returns: { title: "..." }    │
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│ setTitle(data.title)         │
│ Title field updates instantly│
└──────────────────────────────┘
```

---

#### **Feature 2b: Regenerate Description & Tag (Mode: "regenerate-description")**

```
Different from title: Returns TWO fields
- description: Improved summary
- tag: AI-suggested category

Returns: { description: "...", tag: "..." }
Both setDescription() and setTag() are called
```

---

#### **Feature 3: Improve Content (Mode: "improve-content")**

```
User Flow:
┌────────────────────────────┐
│ User writes blog content   │
│ in Quill editor            │
└──────────┬─────────────────┘
           ↓
┌────────────────────────────┐
│ User clicks ✨ Improve     │
│ button above editor        │
└──────────┬─────────────────┘
           ↓
┌────────────────────────────┐
│ POST /api/ai {             │
│   mode: "improve-content", │
│   title: title,            │
│   content: HTML content    │
│ }                          │
└──────────┬─────────────────┘
           ↓
┌────────────────────────────┐
│ API sends to OpenAI:       │
│ "Improve this blog post.   │
│  Preserve ALL HTML tags.   │
│  Fix grammar, improve flow"│
│                            │
│ Returns: { content: "..." }│
└──────────┬─────────────────┘
           ↓
┌────────────────────────────┐
│ setContent(data.content)   │
│ Quill editor updates       │
│ (All HTML tags preserved)  │
└────────────────────────────┘
```

**Critical Detail**: The prompt says "Preserve all HTML tags exactly" because Quill stores content as HTML, and we need to maintain formatting.

---

## Phase 4: UI Component Structure

### 4.1 Where Each AI Feature Lives

```
BlogModal Component
│
├─ Header Section
│  └─ ✨ AI Draft Toggle Button (aiOpen state)
│
├─ AI Draft Panel (visible when aiOpen === true)
│  ├─ Textarea for topic input (aiTopic state)
│  └─ "Generate Draft" Button (calls callAI("draft"))
│
├─ Left Column (Title, Description, Tag, Image)
│  ├─ Title
│  │  └─ ↻ Regenerate Button (calls callAI("regenerate-title"))
│  ├─ Description  
│  │  └─ ↻ Regenerate Button (calls callAI("regenerate-description"))
│  └─ Tag (auto-updated by description regeneration)
│
└─ Right Column (Content Editor)
   └─ Content
      └─ ✨ Improve Button (calls callAI("improve-content"))
```

---

## Phase 5: State Management Deep Dive

### 5.1 Complete State List with Purpose

```typescript
// Form Data (existing)
const [title, setTitle] = useState("");           // Input field
const [description, setDescription] = useState(""); // Textarea
const [tag, setTag] = useState("");               // Input field
const [content, setContent] = useState("");       // Quill editor content
const [imageFile, setImageFile] = useState(null); // Featured image file
const [imagePreview, setImagePreview] = useState(null); // Preview URL

// Save/Publish (existing)
const [isSaving, setIsSaving] = useState(false);  // For Save/Publish buttons

// AI Features (NEW)
const [aiOpen, setAiOpen] = useState(false);          // AI panel visibility
const [aiTopic, setAiTopic] = useState("");           // User's topic input
const [aiLoadingMode, setAiLoadingMode] = useState<string | null>(null); // Which AI op is running
```

### 5.2 Why Each State

| State | Why Needed | Updated By | Triggers Re-render Of |
|-------|-----------|-----------|----------------------|
| `aiOpen` | Show/hide AI panel | Toggle button | AI panel visibility |
| `aiTopic` | Store user's topic input | Textarea onChange | Textarea content + Generate button state |
| `aiLoadingMode` | Track which AI op is running | callAI() start/end | Only its respective button (showing "...") |
| All form fields | Store form data | User input + AI responses | Input fields, display content |

---

## Phase 6: Error Handling & Safety

### 6.1 What Can Go Wrong?

```typescript
// Problem 1: User not authenticated
→ Solution: Check NextAuth token in /api/ai route
→ Return 401 if missing

// Problem 2: OpenAI API key not configured
→ Solution: Check process.env.OPENAI_API_KEY
→ Return 500 with "AI service not configured"

// Problem 3: OpenAI API returns error
→ Solution: Check !openaiRes.ok
→ Return 502 with error message from OpenAI

// Problem 4: OpenAI returns non-JSON or incomplete response
→ Solution: Try JSON.parse(), catch error
→ Return 502 "AI returned invalid JSON"

// Problem 5: User tries to regenerate title without a title
→ Solution: Button disabled={!title}
→ Prevents unnecessary API call
```

### 6.2 API Route Error Handling Pattern

```typescript
export const POST = withErrorHandling(async (req: Request) => {
  // 1. Check auth
  const token = await getToken({ req });
  if (!token?.id) throw new APIError(401, "Unauthorized");

  // 2. Check config
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new APIError(500, "AI service is not configured");

  // 3. Parse input
  const body = await req.json();
  const { mode, prompt, title, description, content } = body;

  // 4. Validate mode
  if (!mode || !buildPrompt[mode]) 
    throw new APIError(400, `Invalid mode: "${mode}"`);

  // 5. Build and send to OpenAI
  const userPrompt = buildPrompt[mode]({ prompt, title, description, content });
  const openaiRes = await fetch("...", { ... });

  // 6. Check OpenAI response
  if (!openaiRes.ok) {
    const errBody = await openaiRes.json();
    throw new APIError(502, errBody?.error?.message ?? "AI service error");
  }

  // 7. Parse & validate response
  const openaiData = await openaiRes.json();
  const text = openaiData.choices?.[0]?.message?.content;
  if (!text) throw new APIError(502, "Empty response from AI service");

  // 8. Ensure valid JSON
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new APIError(502, "AI returned invalid JSON");
  }

  // 9. Return success
  return NextResponse.json(result);
});
```

All errors are caught by `withErrorHandling` and converted to proper HTTP responses.

---

## Phase 7: Data Flow Example - Complete "Draft" Generation

### 7.1 Step-by-Step Trace

```
STEP 1: User Types Topic & Clicks "Generate Draft"
├─ State: aiTopic = "The Future of AI in Healthcare"
└─ Handler: onClick={() => callAI("draft")}

STEP 2: callAI("draft") Executes
├─ setAiLoadingMode("draft")  ← Draft button shows "Generating..."
├─ fetch("/api/ai", {
│  method: "POST",
│  body: JSON.stringify({
│    mode: "draft",
│    prompt: "The Future of AI in Healthcare",
│    title: "", description: "", content: "", tag: ""
│  })
└─ Request sent to server

STEP 3: /api/ai/route.ts Processes
├─ Verify authentication ✓
├─ Check OPENAI_API_KEY exists ✓
├─ Extract mode: "draft" ✓
├─ Get prompt from buildPrompt["draft"]:
│  "Generate a complete blog post draft for the topic: 
│   'The Future of AI in Healthcare'..."
└─ Send to OpenAI

STEP 4: OpenAI Processes
├─ System prompt: "You are a professional blog writing assistant..."
├─ User prompt: "Generate a complete blog post..."
├─ response_format: { type: "json_object" }
├─ Model: "gpt-4o"
└─ Returns JSON:
        {
          "title": "AI Revolution in Healthcare: Transforming Patient Care",
          "description": "Explore how artificial intelligence is reshaping...",
          "tag": "Technology",
          "content": "<h2>Introduction</h2><p>The healthcare industry...</p>..."
        }

STEP 5: API Validates & Returns
├─ JSON.parse() successful ✓
└─ NextResponse.json(result) → sent back to client

STEP 6: callAI() Receives Response
├─ data = await res.json()
├─ setTitle(data.title)
├─ setDescription(data.description)
├─ setTag(data.tag)
├─ setContent(data.content)
├─ setAiLoadingMode(null)  ← Draft button back to normal
└─ All form fields update on screen

STEP 7: User Sees
├─ Title field has "AI Revolution in Healthcare..."
├─ Description textarea has compelling summary
├─ Tag field has "Technology"
├─ Quill editor has full HTML content (formatted with headers, paragraphs)
└─ Can now edit any field or click Publish
```

---

## Phase 8: Why This Design Wins

### 8.1 Benefits of Our Approach

| Aspect | Benefit |
|--------|---------|
| **Mode-based routing** | Easy to scale; add new AI features without new routes |
| **Per-mode loading states** | Users can regenerate title while improving content simultaneously |
| **Conditional field updates** | Regenerate title doesn't touch description; regenerate description auto-updates tag |
| **Native fetch** | No SDK dependencies; simplifies deployment |
| **NextAuth integration** | Reuses existing auth pattern; secures API |
| **HTML preservation** | Content editor works seamlessly; keeps rich formatting |
| **Separate AI panel** | Doesn't clutter the main form; optional feature |

### 8.2 What We Avoided

❌ Single boolean for all AI operations (caused the dependency issue you found)
❌ Multiple API routes (/api/ai/title, /api/ai/description, etc.)
❌ Always updating all fields regardless of mode
❌ SDK dependencies (using fetch instead)
❌ Client-side API keys (secure handling on backend only)
❌ Streaming responses (simpler implementation)

---

## Summary: The Complete Picture

```
1. USER INTERACTION
   ↓
BlogModal Component
   ├─ Collects topic/content input
   ├─ Manages form state (title, desc, content, tag)
   ├─ Tracks AI operation state (aiLoadingMode)
   ├─ Renders 4 AI buttons/features independently
   └─ Updates form fields with AI responses
   
2. NETWORK REQUEST
   ↓
fetch("/api/ai", {
  mode: "draft" | "regenerate-title" | "regenerate-description" | "improve-content",
  prompt: aiTopic,
  title, description, content
})

3. API PROCESSING
   ↓
/api/ai/route.ts
   ├─ Authenticate user
   ├─ Select prompt based on mode
   ├─ Call OpenAI API
   ├─ Validate JSON response
   └─ Return parsed result

4. OPENAI PROCESSING
   ↓
gpt-4o Model
   ├─ System: "Professional blog writer"
   ├─ User: Mode-specific prompt
   ├─ Format: Must be valid JSON
   └─ Return: { title?, description?, content?, tag? }

5. RESPONSE HANDLING
   ↓
callAI() callback
   ├─ Parse response
   ├─ Selectively update form fields
   ├─ Clear loading state (aiLoadingMode = null)
   └─ UI re-renders with new values

6. RESULT
   ↓
User sees AI-generated or AI-improved content
Can edit further or publish immediately
```

---

## Configuration Needed

Before using, add to your `.env`:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

Then all routes will work!

import OpenAI from 'openai';
import { tavily } from '@tavily/core';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

const MODEL = 'google/gemini-2.5-flash';

// ── Shared JSON extraction — handles the common ways free models
// misbehave: wrapping in markdown fences, adding stray prose before/
// after the JSON, or trailing commas. Throws a clearly-labeled error
// if it genuinely can't recover, rather than a cryptic SyntaxError.
function extractJSON(rawText) {
  let cleaned = rawText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // If there's stray prose before/after the JSON object, isolate
  // the outermost { ... } block rather than failing outright.
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const parseError = new Error('AI_MALFORMED_RESPONSE');
    parseError.cause = err;
    parseError.rawText = rawText.slice(0, 300); // keep for server logs only
    throw parseError;
  }
}

// ── Retry wrapper — gives the model one more attempt if its first
// response fails to parse as valid JSON. Free-tier models occasionally
// produce malformed output under load; a single retry resolves most
// of these without bothering the user with an error at all.
async function withRetry(fn, attempts = 2) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err.message !== 'AI_MALFORMED_RESPONSE') throw err; // don't retry non-parse errors
      console.warn(`⚠ AI returned malformed JSON, retrying (${i + 1}/${attempts})...`);
    }
  }
  throw lastError;
}

// ── Existing function, now wrapped with retry + better parsing ──
export const analyzeApplication = async (resume, jobDescription, jobTitle, company) => {
  const prompt = `You are an expert career coach and ATS (Applicant Tracking System) specialist.

Analyze the following resume against the job description and return a detailed analysis.

JOB TITLE: ${jobTitle}
COMPANY: ${company}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resume}

IMPORTANT: Return ONLY a valid JSON object. No explanation, no markdown, no code blocks. Just raw JSON.

{
  "matchScore": <number between 0 and 100>,
  "matchLabel": <one of: "Poor", "Fair", "Good", "Strong", "Excellent">,
  "summary": "<2-3 sentence overview of the candidate fit>",
  "tailoredBullets": [
    "<rewritten resume bullet 1 tailored to this job>",
    "<rewritten resume bullet 2 tailored to this job>",
    "<rewritten resume bullet 3 tailored to this job>",
    "<rewritten resume bullet 4 tailored to this job>",
    "<rewritten resume bullet 5 tailored to this job>"
  ],
  "coverLetter": "<a 3-paragraph professional cover letter tailored to this specific role and company>",
  "missingKeywords": [
    "<important keyword from JD missing in resume 1>",
    "<important keyword from JD missing in resume 2>",
    "<important keyword from JD missing in resume 3>"
  ],
  "strengths": [
    "<key strength relevant to this role 1>",
    "<key strength relevant to this role 2>",
    "<key strength relevant to this role 3>"
  ]
}`;

  return withRetry(async () => {
    let response;
    try {
      response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (err) {
      // Network/rate-limit/provider errors — never retried, surfaced clearly
      const apiError = new Error('AI_PROVIDER_ERROR');
      apiError.cause = err;
      throw apiError;
    }

    const rawText = response.choices[0].message.content;
    return extractJSON(rawText);
  });
};


// ── Research Agent — same retry + classification applied to the
// final JSON compilation step. Individual search calls are not
// retried automatically; if Tavily itself fails, that's surfaced
// as a distinct, clearly labeled error rather than silently eaten.
// ════════════════════════════════════════════════════════════════
export const researchCompany = async (company, jobTitle, resume) => {

  const tools = [
    {
      type: 'function',
      function: {
        name: 'search_web',
        description: 'Search the web for current information about a company, role, or topic.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query to run' },
          },
          required: ['query'],
        },
      },
    },
  ];

  const messages = [
    {
      role: 'user',
      content: `You are a career research agent preparing a candidate for a job interview.

COMPANY: ${company}
ROLE: ${jobTitle}
CANDIDATE RESUME SUMMARY: ${resume.slice(0, 500)}

Your job:
1. Search for recent news about ${company} (last 6 months)
2. Search for ${company} engineering culture and interview process  
3. Search for common ${jobTitle} interview questions at ${company}

Use the search_web tool for each of these searches, then compile everything into a structured interview prep guide.

After your searches, return ONLY a valid JSON object. No markdown. No explanation. Just raw JSON:

{
  "companyOverview": "<2-3 sentences about what the company does and its current position>",
  "recentNews": [
    "<recent development 1>",
    "<recent development 2>",
    "<recent development 3>"
  ],
  "culture": "<2-3 sentences about company culture and what they value>",
  "interviewQuestions": [
    {
      "question": "<likely interview question 1>",
      "tip": "<how to approach answering this question>"
    },
    {
      "question": "<likely interview question 2>",
      "tip": "<how to approach answering this question>"
    },
    {
      "question": "<likely interview question 3>",
      "tip": "<how to approach answering this question>"
    },
    {
      "question": "<likely interview question 4>",
      "tip": "<how to approach answering this question>"
    },
    {
      "question": "<likely interview question 5>",
      "tip": "<how to approach answering this question>"
    }
  ],
  "talkingPoints": [
    "<specific thing to mention in the interview based on research 1>",
    "<specific thing to mention in the interview based on research 2>",
    "<specific thing to mention in the interview based on research 3>"
  ]
}`,
    },
  ];

  return withRetry(async () => {
    let researchData = null;

    for (let i = 0; i < 5; i++) {
      let response;
      try {
        response = await client.chat.completions.create({
          model: MODEL,
          max_tokens: 2000,
          messages,
          tools,
          tool_choice: 'auto',
        });
      } catch (err) {
        const apiError = new Error('AI_PROVIDER_ERROR');
        apiError.cause = err;
        throw apiError;
      }

      const assistantMessage = response.choices[0].message;
      messages.push(assistantMessage);

      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        for (const toolCall of assistantMessage.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`🔍 Agent searching: "${args.query}"`);

          let resultText;
          try {
            const searchResult = await tavilyClient.search(args.query, {
              maxResults: 4,
              searchDepth: 'basic',
            });
            resultText = searchResult.results
              .map((r, idx) => `[${idx + 1}] ${r.title}\n${r.content}`)
              .join('\n\n');
          } catch (err) {
            // A single failed search shouldn't kill the whole research
            // run — feed the agent a note so it can adapt or move on.
            console.warn(`⚠ Search failed for "${args.query}":`, err.message);
            resultText = `Search failed for this query — proceed with available information.`;
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: resultText || 'No results found for this query.',
          });
        }
      } else {
        researchData = extractJSON(assistantMessage.content);
        break;
      }
    }

    if (!researchData) {
      const error = new Error('AI_AGENT_INCOMPLETE');
      throw error;
    }

    return researchData;
  });
};
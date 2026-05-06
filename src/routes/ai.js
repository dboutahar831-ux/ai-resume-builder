const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const auth = require('../middleware/auth');

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert resume writer and career coach with 15+ years of experience crafting professional resumes that get interviews. Your role is to generate polished, ATS-optimized resume content that is specific, impactful, and tailored to the candidate's field and experience level.

Guidelines:
- Use strong action verbs (Led, Built, Optimized, Delivered, Architected, etc.)
- Include quantifiable achievements where plausible (percentages, team sizes, timelines)
- Keep tone professional yet natural — avoid buzzword overload
- Match seniority: junior roles focus on learning and contributions; senior roles emphasize leadership and impact
- Skills should be specific technologies, tools, and methodologies relevant to the field
- Experience descriptions should be 2-3 bullet points, each on its own line starting with •

Always respond with valid JSON only — no markdown fences, no explanation.`;

router.post('/generate', auth, async (req, res) => {
  const { job_title, years_experience, field, existing_skills } = req.body;

  if (!job_title || !years_experience || !field) {
    return res.status(400).json({ error: 'job_title, years_experience, and field are required' });
  }

  const level =
    years_experience <= 1 ? 'entry-level' :
    years_experience <= 3 ? 'junior' :
    years_experience <= 6 ? 'mid-level' :
    years_experience <= 10 ? 'senior' : 'principal/staff';

  const userPrompt = `Generate resume content for:
- Job Title: ${job_title}
- Field: ${field}
- Experience: ${years_experience} year${years_experience !== 1 ? 's' : ''} (${level})
${existing_skills ? `- Existing Skills: ${Array.isArray(existing_skills) ? existing_skills.join(', ') : existing_skills}` : ''}

Return a JSON object with exactly these three keys:
{
  "summary": "A 2-3 sentence professional summary highlighting expertise, key strengths, and value proposition",
  "skills": ["skill1", "skill2", "skill3", ...],
  "experience_description": "• Bullet 1\\n• Bullet 2\\n• Bullet 3"
}

The skills array should contain 8-12 specific, relevant skills for this role and field.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) throw new Error('No text in Claude response');

    const generated = JSON.parse(textBlock.text);

    if (!generated.summary || !generated.skills || !generated.experience_description) {
      throw new Error('Incomplete response from AI');
    }

    res.json(generated);
  } catch (err) {
    console.error('AI generation error:', err.message);
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: 'AI returned malformed response. Please try again.' });
    }
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

// POST /api/ai/enhance — improve a social post text (powered by Groq, free)
router.post('/enhance', auth, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required.' });
  if (text.trim().length < 5) return res.status(400).json({ error: 'Text is too short to enhance.' });

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 512,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are a professional content writer for Nexly, a career social platform.
Your job: rewrite the user's draft post to sound polished, engaging, and professional — suitable for a LinkedIn-style audience.
Rules:
- Keep the original meaning and language (if Arabic write Arabic, if English write English)
- Make it concise, clear, and human — no corporate buzzwords or fluff
- Add a hook at the start if the text is long enough
- Keep emojis only if the user already used them
- Return ONLY the improved text, no explanations, no quotes, no labels`,
          },
          { role: 'user', content: `Enhance this post:\n\n${text.trim()}` },
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq error ${groqRes.status}`);
    }

    const data = await groqRes.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim();
    if (!enhanced) throw new Error('No response from AI');
    res.json({ enhanced });
  } catch (err) {
    console.error('Enhance error:', err.message);
    res.status(500).json({ error: 'Failed to enhance text. Please try again.' });
  }
});

module.exports = router;

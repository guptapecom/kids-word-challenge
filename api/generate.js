export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ageGroup, mode } = req.body || {};
  const age = ageGroup || "7-9 years old";
  const challengeMode = mode || "topic"; // "topic" or "word"
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing API Key in environment variables' });
  }

  const categories = {
    "4-6 years old": ["My Favorite Things & Animals", "Fun at Home and School", "Pretend Play & Magical Friends", "Food, Festivals & Celebrations"],
    "7-9 years old": ["Wacky Science & Funny Inventions", "Animals, Nature & Outdoor Adventures", "School Mischief & Playground Games"],
    "10-12 years old": ["Time Travel & Historical Mysteries", "Space, Oceans & Extreme Survival", "Sports, Hobbies & Hidden Talents"],
    "13-15 years old": ["Tech, AI & Social Media Dilemmas", "School Rules, Society & Youth Trends", "Global Travel, Street Culture & Food"]
  };

  const ageCategories = categories[ageGroup] || categories["7-9 years old"];
  const chosenCategory = ageCategories[Math.floor(Math.random() * ageCategories.length)];

  // Adjust prompt dynamically based on whether the user requested a full topic or a single prompt word
  let prompt = "";
  if (challengeMode === "word") {
    prompt = `You are a lively game host for children's speaking confidence. Generate a single, highly engaging prompt WORD or very short object tailored for a child aged ${age} based on the theme "${chosenCategory}". 
    
    Rules for Word Mode:
    1. The "main" value must be a single powerful word or micro-object (e.g., "Spaceship", "Rainbow", "Sneakers", "Secret").
    2. Provide 2-3 fun extra bonus words that fit naturally.
    3. Return STRICTLY as valid JSON:
    {
      "main": "Single Word Here",
      "extra": ["bonus1", "bonus2"]
    }`;
  } else {
    prompt = `You are a lively, creative game host for children's extempore speaking. Generate a 1-minute speech challenge tailored for a child aged ${age}. Theme: ${chosenCategory}.
    
    Return STRICTLY as valid JSON:
    {
      "main": "Engaging Topic Title",
      "extra": ["word1", "word2", "word3"]
    }`;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.85,
            topP: 0.95
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(rawText);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate prompt', details: err.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ageGroup } = req.body || {};
  const age = ageGroup || "7-9 years old";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing API Key in environment variables' });
  }

  // Random theme sparks to force topic divergence
  const categories = [
    "Wild animals or funny pets",
    "Outer space or alien planets",
    "Secret superhero powers or gadgets",
    "Fun inventions or wacky machines",
    "Under the ocean adventures",
    "School recess games or playground fun",
    "Time travel or dinosaur encounters",
    "A magical store or enchanted forest",
    "Cooking a weird or delicious recipe",
    "Sports, hobbies, or circus stunts",
    "Building a fort or secret treehouse",
    "A day when gravity stopped working",
    "A world where everyone can talk to animals",
    "A day in the life of a tiny insect or bug",
    "A magical backpack that can take you anywhere",
    "Family and Friends",
    "My favorite holiday or festival"
  ];
  const chosenCategory = categories[Math.floor(Math.random() * categories.length)];
  const randomSeed = Math.floor(Math.random() * 10000);

  const prompt = `You are a creative, fun game host for kids. Generate a 1-minute speaking topic for a child aged ${age}.

Random Seed: ${randomSeed}
Theme Inspiration: Focus specifically around "${chosenCategory}".

Rules:
1. Pick an easy, imaginative, and fresh topic that is very quick for a child to picture and talk about.
3. Provide 3 easy, concrete adjoining challenge words that fit the story naturally.

Return the response STRICTLY as JSON:
{"main": "Vibrant Topic Title", "extra": ["word1", "word2", "word3"]}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 1.2,
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
    return res.status(500).json({ error: 'Failed to generate word prompt', details: err.message });
  }
}

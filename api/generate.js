import fallbackTopics from './fallbackTopics.js';
import fallbackWords from './fallbackWords.js';

function getFallbackItem(isWordMode, ageGroup) {
  const dataset = isWordMode ? fallbackWords : fallbackTopics;
  const list = dataset[ageGroup] || dataset["7-9 years old"] || [];
  return list[Math.floor(Math.random() * list.length)];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ageGroup, mode, subscriptionType } = req.body || {};
  const isWordMode = mode === 'word';
  const age = ageGroup || "7-9 years old";

  // Non-subscribed users get random fallback data without calling LLM
  if (subscriptionType !== 'Subscribed') {
    const fallbackItem = getFallbackItem(isWordMode, age);
    return res.status(200).json(fallbackItem);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing API Key in environment variables' });
  }

  // Random theme sparks to force topic divergence
  const categories = {
    "4-6 years old": [
      "My Favorite Things & Animals", "Fun at Home and School", "Pretend Play & Magical Friends",
      "Food, Festivals & Celebrations", "My Favorite Toys and Bedtime Stories", "Cute Pets and Friendly Animals",
      "Yummy Treats, Ice Creams, and Fruits", "Fun in the Park and Playground", "Rainy Days, Puddles, and Rainbows",
      "Pretending to Be a Bird, Fish, or Cat", "Colors, Cartoons, and Drawing Fun", "My Grandparents, Cousins, and Best Friends",
      "Festivals, Sweets, and Birthday Parties"
    ],
    "7-9 years old": [
      "Wacky Science & Funny Inventions", "Animals, Nature & Outdoor Adventures", "School Mischief & Playground Games",
      "Superheroes, Gadgets & Magic Quests", "School Bus Rides and Van Commutes", "Lunch Break and Lunchbox Sharing",
      "Morning Rush to Get Ready for School", "Playing in the Colony or Apartment Park", "Rainy Days and Getting Soaked on the Way Home",
      "Weekend Shopping and Grocery Trips with Parents", "Visiting Grandparents during Holidays", "Learning a New Skill (Cycling, Swimming, or Skating)",
      "Watching Cartoons and TV Shows with Siblings", "Birthday Parties and Return Gifts", "A Funny Moment in the Classroom",
      "Losing an Eraser, Pencil, or Water Bottle at School"
    ],
    "10-12 years old": [
      "Time Travel & Historical Mysteries", "Space, Oceans & Extreme Survival", "Sports, Hobbies & Hidden Talents",
      "Funny 'What If' Dilemmas & Inventions", "Annual Day, Sports Day, or School Competitions", "Preparing for Exams vs. Last-Minute Panic",
      "Street Food Treats (Chaat, Maggie, Momos, Ice Gola)", "Playing Evening Games (Cricket, Football, Badminton, Hide & Seek)",
      "Power Cuts and Summer Evenings on the Balcony", "Dealing with Sibling Fights and Room Sharing", "Going on a Family Road Trip or Train Journey",
      "Packing My School Bag According to the Timetable", "Trying to Wake Up on a Cold Winter Morning", "Pocket Money and Saving for Something You Want",
      "Helping Parents with Daily Kitchen or House Chores", "The Excitement of Summer Vacation Starting"
    ],
    "13-15 years old": [
      "Tech, AI & Social Media Dilemmas", "School Rules, Society & Youth Trends", "Global Travel, Street Culture & Food",
      "Debatable 'What Ifs' & Ethical Choices", "Smartphones, Gaming, and Screen-Time Debates", "Should School Start 2 Hours Later?",
      "Street Food Culture vs. Fast Food Chains", "Social Media Trends: Fun or Distraction?", "If You Could Erase One Daily Chore Forever",
      "Dealing with Peer Pressure and Making Real Friends", "The Best and Worst Parts of Family Functions", "AI, Robots, and the Future of Jobs",
      "Is Homework Really Necessary?", "Travel Diaries: Exploring a New City or State"
    ]
  };

  const chosenCategory = (categories[ageGroup] || categories["7-9 years old"])[
    Math.floor(Math.random() * (categories[ageGroup] || categories["7-9 years old"]).length)
  ];

  const prompt = isWordMode 
    ? `You are an encouraging host for children's extempore speaking. Generate a single, highly engaging, fun, and age-appropriate word or simple 2-word noun phrase for a child aged ${age} to speak about (Theme context: ${chosenCategory}).
Age Rules:
- Ages 4-6: Everyday objects or familiar animals (e.g., Puppy, Bicycle, Rainbow, Pancake).
- Ages 7-9: Action or imaginative words (e.g., Treehouse, Dinosaur, Spaceship, Magic Wand).
- Ages 10-12: Cool objects, places, or concepts (e.g., Time Machine, Submarine, Rollercoaster).
- Ages 13-15: Thematic, cultural, or interesting items/concepts (e.g., Smartphone, Virtual Reality, Wilderness).

Also supply 2-3 simple related clue words in "extra".
Return strictly valid JSON:
{
  "main": "The Chosen Word",
  "extra": ["clue1", "clue2", "clue3"]
}`
    : `You are a lively, creative game host for children's extempore speaking. Generate a 1-minute speech challenge tailored for a child aged ${age}.

Theme Inspiration: Focus specifically around ${chosenCategory}.

Age-Specific Adaptation Rules:
- Ages 4-6: Keep topics sensory, visual, and personal (favorite animals, toys, simple "pretend play"). Words must be simple everyday objects.
- Ages 7-9: Focus on whimsical "what-if" stories, magical gadgets, and school adventures. Words should spark action.
- Ages 10-12: Focus on creative problem-solving, quirky inventions, or funny dilemmas. Words should add a plot twist.
- Ages 13-15: Focus on relatable opinions, tech/gaming culture, school life, or moral dilemmas. Words should be thematic concepts or objects.

General Rules:
1. Make the topic instantly relatable to Indian and global kids (e.g., school life, street food, festivals, family, modern hobbies).
2. Avoid generic academic essay prompts; make it fun, conversational, and easy to start speaking within 10 seconds.
3. Provide 3 concrete challenge words that the child must naturally include while speaking.
4. Fix grammar/quotes strictly in JSON.

Return the response STRICTLY as valid JSON:
{
  "main": "Engaging Topic Title",
  "extra": ["word1", "word2", "word3"]
}`;

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
            temperature: 0.8,
            topP: 0.95
          }
        })
      }
    );

    if (!response.ok) {
      // Fallback if the external API request fails
      return res.status(200).json(getFallbackItem(isWordMode, age));
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(rawText);

    return res.status(200).json(parsed);
  } catch (err) {
    // Gracefully serve fallback data if parsing or execution throws an error
    return res.status(200).json(getFallbackItem(isWordMode, age));
  }
}

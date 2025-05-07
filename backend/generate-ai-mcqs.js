const express = require('express');
const axios = require('axios'); //Axios is a promise-based JavaScript library used to make HTTP requests (like GET, POST) to APIs
const router = express.Router();

router.post("/generate-ai-mcqs", async (req, res) => {
  const { courseName } = req.body;

  if (!courseName) {
    return res.status(400).json({ error: "Course name is required" });
  }

  try {
    const prompt = `Generate 5 MCQ questions about ${courseName}.
Each MCQ should have 4 options and mention the correct option number (1 to 4).
Respond ONLY with valid JSON array. Do NOT include any explanation, only pure JSON.

Format:
[
  { "question": "....", "option1": "....", "option2": "....", "option3": "....", "option4": "....", "correct_option": "2" },
  ...
]
`;

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 800
    }, {
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json'
      }
    });

    const aiContent = response.data.choices[0].message.content.trim();
    
    let mcqs;
    try {
      mcqs = JSON.parse(aiContent);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError.message);
      console.error("AI response:", aiContent);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    res.json({ mcqs });
  } catch (error) {
    console.error("Error generating MCQs:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to generate AI MCQs" });
  }
});

module.exports = router;

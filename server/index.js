const express = require("express");
const axios = require("axios");
const cors = require("cors");
const posts = require("./data");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const openaiApiKey = process.env.OPENAI_API_KEY;

app.get("/filter-content", async (req, res) => {
    const userPrefs = { location: "Ethiopia", interests: ["dance"] };

    const prompt = `The user preferences are: location: ${userPrefs.location}, interests: ${userPrefs.interests.join(", ")}.
    Here are the posts: ${posts.map(p => p.tag + " - " + p.title).join("; ")}.
    Filter only posts relevant to their preferences. If no relevant posts are found, respond with "No content matched your preferences."`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Please provide a JSON array of posts that match the user preferences.' },
                { role: 'user', content: prompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const responseText = response.data.choices[0].message.content;

        // Log the raw response for troubleshooting
        console.log("Raw AI Response:", responseText);

        let filteredPosts;
        try {
            filteredPosts = JSON.parse(responseText);
        } catch (e) {
            console.error("JSON Parsing Error:", e.message);
            filteredPosts = responseText.includes("No content") ? [] : [{ title: responseText, tag: "miscellaneous" }];
        }

        if (!filteredPosts || filteredPosts.length === 0) {
            return res.json({ message: "No content matched your preferences." });
        }

        res.json(filteredPosts);
    } catch (error) {
        console.error("Error processing request:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Error processing request", details: error.response ? error.response.data : error.message });
    }
});


app.listen(3000, () => console.log("Server running on port 3000"));

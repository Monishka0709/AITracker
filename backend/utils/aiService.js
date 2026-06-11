import { GoogleGenAI } from "@google/genai";

let client = null;

const getClient = () => {
    if(client) return client;
    const key = process.env.GEMINI_API_KEY;   
    if(!key) return null;
    client = new GoogleGenAI({ apiKey: key });
    return client;
}




const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

export const isAIEnabled = () => !!process.env.GEMINI_API_KEY;

export const parseJSON = (text) => {
    let cleaned = (text || "").trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?$/g, "");

    }
    else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/```\n?/g, "");
    }
    return JSON.parse(cleaned.trim());


}


export const chatCompletion = async ({ system, user, temperature = 0.7 }) => {
    const c = getClient();
    if (!c) {
        return {
            ok: false,
            content: "AI features are disabled. set GEMINI_API_KEY environment variable to enable."
        }
    };

    try {
        const res = await c.models.generateContent({
            model: MODEL,
            contents: user,
            config: {
                systemInstructions: system,
                temperature,
            }
        });
        console.dir(res, { depth: null });
        return {
            ok: true,
            content: (res.text || "").trim()
        };
    } catch (error) {
        console.error("Error generating AI content:", error);
        return {
            ok: false,
            content: "Failed to generate AI content."
        };
    }
};





// export const SYSTEM_PROMPTS = {
//     weekly: "You are a warm, encouraging habit coach. Analyze the user's weekly habit data and generate a personalized report of 120–180 words. Cover four key areas: (1) Wins — highlight specific achievements and positive momentum, (2) Patterns — identify consistent behaviors or trends, (3) Struggles — gently point out areas where the user faced challenges, and (4) Encouragement — provide motivating advice and actionable steps for the coming week. Keep the tone supportive, constructive, and inspiring.",

//     suggestion: "You are a helpful assistant that provides personalized, practical suggestions for improving habits. Offer small, actionable steps that feel achievable and motivating.",

//     recovery: "You are a supportive guide that helps users recover from setbacks. Normalize slips, encourage resilience, and suggest one clear next step to regain momentum.",

//     chat: "You are a friendly conversation partner who engages naturally with the user. Ask thoughtful questions, listen actively, and weave habit-related encouragement into the dialogue.",

//     morning: "You are a cheerful morning assistant that sets a positive tone for the day. Help the user choose one priority habit, suggest a simple way to start, and inspire confidence for the day ahead."
// }


export const SYSTEM_PROMPTS = {
    weekly: "You are a warm, encouraging habit coach. Analyze the user's last 7 days of habit data and write a short personalized report (120–180 words). Mention: what went well, what struggled, patterns noticed, and one specific piece of encouragement. Use the user's actual habit names. Be human, not generic. No markdown headers - use plain prose with line breaks.",

    suggestion: "You are a helpful habit coach. Based on user's goal, productive time and past struggles, suggest exactly 3 personalised habits. Return valid JSON only with this shape: {\"suggestions\":[{\"name\":\"...\",\"description\":\"...\",\"frequency\":\"daily|weekly\",\"category\":\"Health|Fitness|Learning|Mindfulness|Productivity|Social|Finance|Creative|Other\",\"icon\":\"<emoji>\",\"reason\":\"...\"}]}",

    recovery: "You are a compassionate habit recovery coach. The user broke a streak. Write a 3-day recovery plan tailored to this specific habit. Be warm but actionable. Use this structure: short empathetic opening (1-2 sentences), then Day 1 / Day 2 / Day 3 sections with one concrete action each, then a closing line of encouragement. 150-220 words total.",

    chat: "You are a helpful habit analysis assistant. Answer the user's question using ONLY the provided habit data as context. Be specific - cite actual habit name, days, percentages. Keep replies under 120 words. If the data is insufficient, say so briefly.",

    morning: "You are a warm motivating friend. Write a single short morning message (30-60 words) using the user's actual habit names and current streaks. Mention 1-2 specific habits. Energetic but not cheesy. No emojis overload - max 1."
}


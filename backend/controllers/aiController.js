import Habit from '../models/Habit.js';
import { chatCompletion, SYSTEM_PROMPTS } from '../utils/aiService.js';
import AIInsight from '../models/AIInsight.js';
import HabitLog from '../models/HabitLog.js';
import { todayKey, lastNDays, calcStreaks } from '../utils/dateHelpers.js';

const buildWeeklyContext = async (userId) => {
    const habits = await Habit.find({ userId, isArchived: false });
    const days = lastNDays(7);
    const logs = await HabitLog.find({ userId, completedDate: { $in: days } });
    const perHabit = habits.map((h) => {
        const completed = logs.filter(l => l.habitId.toString() === h._id.toString()).map(l => l.completedDate.toString().slice(0,10));
        return {
            name: h.name,
            category: h.category,
            frequency: h.frequency,
            completedDays: completed,
            targetDays: h.targetDays
        }
    })
    

    return {days, perHabit};
};

export const weeklyReport = async (req, res) => {
    try{
        const ctx = await buildWeeklyContext(req.user._id);
        if(!ctx.perHabit.length) {
            return res.json({ content: "You don't have any active habits yet. Create your first habit to start tracking- I'll generate a weekly report once you have some data." });
        }

        const userMsg = `Here is the user's habit data for the past 7 days (${ctx.days[0]} to ${ctx.days[6]}):\n\n${ctx.perHabit
        .map(
            (h) => `- ${h.name} (${h.category}, ${h.frequency}): completed ${h.completedDays} of the past 7 days, target is ${h.targetDays} /week`
        )
        .join("\n")}\n\nPlease write the personalised weekly report now.`;


        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.weekly,
            user: userMsg
        });

        await AIInsight.create({
            userId: req.user._id,
            type: "weekly",
            content
        });
        res.json({ content });

    } catch (error) {
         res.status(500).json({ message: error.message });
    }   
}

export const suggestHabits = async (req, res) => {
    try {
        const { goals, productiveTime, struggles } = req.body;

        
        const userMsg = `
User goals: ${goals || "not provided"}
Most productive time: ${productiveTime || "not provided"}
Struggles: ${struggles || "not provided"}

Suggest EXACTLY 3 habits.

Return ONLY valid JSON.

Required format:

{
  "suggestions": [
    {
      "name": "...",
      "description": "...",
      "frequency": "daily",
      "category": "Health|Fitness|Learning|Mindfulness|Productivity|Social|Finance|Creative|Other",
      "icon": "🔥",
      "reason": "..."
    }
  ]
}

Rules:
- Exactly 3 suggestions
- Every suggestion must contain:
  name,
  description,
  frequency,
  category,
  icon,
  reason
- Do not include any additional text
- Do not use markdown
`;

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.suggestion,
            user: userMsg
        });

        // Extract raw text from Gemini response
        let raw = "";
        if (content?.parts?.length) {
            raw = content.parts.map(p => p.text).join("\n");
        } else if (typeof content === "string") {
            raw = content;
        }

        let suggestions = [];
        try {
            // Clean code fences
            raw = raw.replace(/```json|```/g, "").trim();

            // Parse JSON
            const parsed = JSON.parse(raw);

            // Handle both array and object-with-suggestions
            if (Array.isArray(parsed)) {
                suggestions = parsed;
                console.log(suggestions)
            } else if (parsed.suggestions) {
                suggestions = parsed.suggestions;
                console.log("elseif")
                console.log(suggestions)
            }
        } catch (err) {
            console.error("Parsing failed:", err.message);
            suggestions = [];
        }

        // Fallback defaults if parsing fails or empty
        if (!suggestions.length) {
            suggestions = [
                {
                    name: "10-minute morning walk",
                    description: "Take a short walk in the morning to boost your energy and mood.",
                    frequency: "daily",
                    category: "Fitness",
                    icon: "🚶‍♂️",
                    reason: "Low friction way is to build consistency early in the day."
                },
                {
                    name: "Read 5 pages",
                    description: "Short daily reading to build a learning routine.",
                    frequency: "daily",
                    category: "Learning",
                    icon: "📚",
                    reason: "Compounds into significant knowledge over weeks."
                },
                {
                    name: "2 minutes of mindful breathing",
                    description: "Pause and breathe to reset focus and reduce stress.",
                    frequency: "daily",
                    category: "Mindfulness",
                    icon: "🧘",
                    reason: "Tiny anchor habit that fits any schedule."
                }
            ];
        }

        // Save to DB if needed
        await AIInsight.create({
            userId: req.user._id,
            type: 'suggestion',
            content: JSON.stringify(suggestions),
            meta: { goals, productiveTime, struggles }
        });

        res.json({ suggestions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const recoveryPlan = async(req, res) => {
    try{
        const { habitId } = req.body;
        const habit = await Habit.findOne({
            _id: habitId,
            userId: req.user._id
        });
        if(!habit) return res.status(404).json({ message: 'Habit not found'});

        const logs = await HabitLog.find({
            userId: req.user._id,
            habitId

        }).sort({completedDate: -1})
        const keys = logs.map((l) => l.completedDate)
        const { current, longest } = calcStreaks(keys);


        const userMsg = `Habit: ${habit.name} (${habit.category}).\nDescription: ${habit.description || "none"}.\nCurrent streak: ${current} days. Longest ever: ${longest} days. The user just broke a streak. Write a warm, actionable 3-day recovery plan. `
        console.log(userMsg)

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.recovery,
            user: userMsg
        })
        await AIInsight.create({
            userId: req.user._id,
            type: 'recovery',
            content,
            meta: { habitId }
        })
        res.json(content);
    }
    catch(err) {
        res.status(500).json({ message: err.message })
    }
}

export const chatAnalysis = async(req, res) => {
    try{
        const { question } = req.body;
        if(!question)
            return res.status(400).json({message: 'Question is required'});
        const habits = await Habit.find({
            userID: req.user._id,
            isArchived: false
        })
        const days = lastNDays(30);
        const logs = await HabitLog.find({
            userId: req.user._id,
            completedDate: { $gte: days[0], $lte: days[days.length - 1]}
        });

        const context = habits.map((h) => {
            const hlogs = logs.filter(
                (l) => String(l.habitId) === String(h._id))

                const byDow = [0, 0, 0, 0, 0, 0, 0];
                for( const l of hlogs) 
                {
                    const dow = new Date(l.completedDate).getDay();
                    byDow[dow] += 1;
                }
                return `${h.name} (${h.category}): ${hlogs.length}/30 in last 30 days, by weekday [Sun,Mon,Tue,Wed,Thu,Fri,Sat]
                {$(byDow
            )}` 
    
        }).join('\n')

        const userMsg = `User question: "${question}"\n\nUser data (last 30 days): \n${context}\n\nAnswer now. `
        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.chat,
            user: userMsg
        })
        await AIInsight.create({
            userId: req.user._id,
            type:'chat',
            content,
            meta:{question}
        })
        res.json({ content })
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
}

export const morningMotivation = async( req, res) => {
    try{
        const habits = await Habit.find({
            userId: req.user._id,
            isArchived: false
        })
        if(!habits.length) {
            return res.json({
                content: "Good morning! Add your first habit today and let's get the momentum started"

            })

        }
        const days = lastNDays(30);
        const logs = await HabitLog.find({
            userId: req.user._id,
            completedDate: { $gte: days[0], $lte: days[days.length - 1]}
        });

        const ctx = habits.map((h) => {
            const hlogs = logs.filter(
                (l) => String(l.habitId) === String(h._id))
                .map((l) => l.completedDate)
                .sort().reverse();
                const { current } = calcStreaks(hlogs);
                return `${h.name}: current streak ${current}`

        }).join('\n')

        const today = todayKey();
        // const todayLogs = logs.filter((l) => l.completedDate===today);
        const todayLogs = logs.filter((l) => todayKey(new Date(l.completedDate)) === today);
        const done = todayLogs.length;
        const total = habits.length;

        const userMsg = `Today's habits and streaks:\n${ctx}\n\nDone today: ${done}/s${total}. Write the morning motivation`

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.morning,
            user: userMsg,
            temperature: 0.8
        })

        await AIInsight.create({
            userId: req.user._id,
            type:'morning',
            content
        })
        res.json({content})
        
    }
    catch(err) {
        res.status(500).json({message: err.message})
    }
}
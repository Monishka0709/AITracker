import HabitLog from '../models/HabitLog.js';
import Habit from '../models/Habit.js';
import {todayKey,
last90Days,
lastNDays,
calcStreaks
} from '../utils/dateHelpers.js';

export const markComplete = async (req, res) => {
    try {
        const { habitId, date } = req.body;
        const completedDate = date || todayKey();
        const habit = await Habit.findOne({ _id: habitId, userId: req.user._id });
        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }
        const log = await HabitLog.findOneAndUpdate(
            { userId: req.user._id, habitId, completedDate },
            { $setOnInsert: { userId: req.user._id, habitId, completedDate } },
            { upsert: true, new: true }
        );
        res.status(200).json(log);

    }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}


export const unmarkComplete = async (req, res) => {
    try {
        const { habitId, date } = req.body;
        const completedDate = date || todayKey();
        await HabitLog.findOneAndDelete({ userId: req.user._id, habitId, completedDate });
        res.status(200).json({ message: 'Marked as incomplete' });
    }catch (error) {
        console.error(error);
           res.status(500).json({ message: 'Server error' });
    }   
}

export const getToday = async (req, res) => {
    try {
        const today = todayKey();
        const logs = await HabitLog.find({ userId: req.user._id, completedDate: today });
        res.status(200).json(logs);
    }catch (error) {
        console.error(error);
           res.status(500).json({ message: 'Server error' });
    }   
}


export const getRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: { $gte: start, $lte: end }
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getHeatmap = async (req, res) => {
    try {
        const days = last90Days();
        const logs = await HabitLog.find({ userId: req.user._id, completedDate: { $in: days } });
        const counts = {};
        for (const d of days) {
            counts[d] = 0;
        }
        for (const l of logs) {
            counts[l.completedDate] = (counts[l.completedDate] || 0) + 1;
        }
        const data = days.map(d => ({ date: d, count: counts[d] }));
        res.status(200).json(data);
    }catch (error) {
        console.error(error);
           res.status(500).json({ message: 'Server error' });
    }
}

export const getHabitStats = async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.user._id });
        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }
        const logs = await HabitLog.find({ userId: req.user._id, habitId: habit._id }).sort({completedDate: -1});
        const dateKeys = logs.map(l => l.completedDate);
        const { current, longest } = calcStreaks(dateKeys);

        const createdKey = habit.createdAt.toISOString().slice(0,10);
        const today = todayKey();
        const start = new Date(createdKey)
        const end = new Date(today);
        const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const completionRate = Math.round((logs.length / totalDays) * 100);


        const monthly = {};
        for(const l of logs) {
            const m = l.completedDate.slice(0,7);
            // const m = new Date(l.completedDate).toISOString().slice(0,7);

            monthly[m] = (monthly[m] || 0) + 1;
        }
        res.status(200).json({
            habit,
            totalCompletions: logs.length,
            currentStreak: current,
            longestStreak: longest,
            completionRate,
            monthly
        });
    }
        catch (error) {
        console.error(error);
           res.status(500).json({ message: 'Server error' });
    }
}

export const getAllStats = async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user._id, isArchived: false });
        const days = lastNDays(30);
        const logs = await HabitLog.find({ userId: req.user._id, completedDate: { $in: days } });

        const perHabit = habits.map(h => {
            const habitLogs = logs.filter(l => l.habitId.toString() === h._id.toString());
            const dateKeys = habitLogs
                .map(l => new Date(l.completedDate).toISOString().slice(0,10))
                .sort((a, b) => new Date(b) - new Date(a));
            const { current, longest } = calcStreaks(dateKeys);
            return {
                habitId: h._id,
                name: h.name,
                icon: h.icon,
                color: h.color,
                category: h.category,
                completion30d: habitLogs.length,
                currentStreak: current,
                longestStreak: longest,
            };
        });

        res.status(200).json({ perHabit, days });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

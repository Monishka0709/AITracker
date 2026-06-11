import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export const toDateKey = (date) => format(date, 'yyyy-MM-dd');

export const todayKey = () => toDateKey(new Date());

export const last90Days = () => {
    const end = new Date();
    const start  = subDays(end, 89);
    return eachDayOfInterval({ start, end }).map(toDateKey);
}

export const currentWeekDays = () => 
{
    const now = new Date();
    const start = startOfWeek(now, {weekStartsOn:1});
    const end = endOfWeek(now, {weekStartsOn:1}) ;
    return eachDayOfInterval({ start, end }).map(toDateKey);
}

export const lastNDays = (n) => {
    const end = new Date();
    const start  = subDays(end, n-1);
    return eachDayOfInterval({ start, end }).map(toDateKey);
}

export const calcStreaks = (sortedDateKeys) => {
    if(!sortedDateKeys.length) return { current: 0, longest: 0} 

    const set = new Set(sortedDateKeys);
    const today = todayKey();
    const yesterday = toDateKey(subDays(new Date(), 1));


    let current = 0;
    let cursor = new Date();
    if(!set.has(today) && !set.has(yesterday))  {
        current = 0;

    }

    else {
        if(!set.has(today)) cursor = subDays(cursor, 1);
        while(set.has(toDateKey(cursor))) {
            current += 1;
            cursor = subDays(cursor, 1)
        }
    }


    let longest = 0;
    let streak = 0;
    let prevDate = null;

    const dates = Array.from(set).sort((a, b) => new Date(a) - new Date(b));
    for (const d of dates) {
        if (prevDate) {
            const expectedNext = toDateKey(subDays(new Date(d), 1));
            if (expectedNext === prevDate) {
                streak += 1;
            } else {
                streak = 1;
            }
        } else {
            streak = 1;
        }
        longest = Math.max(longest, streak);
        prevDate = d;
    }

    return { current, longest };
}
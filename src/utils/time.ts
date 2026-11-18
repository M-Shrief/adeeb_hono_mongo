

export const Now = () => new Date(Date.now())

export const NowWithDelta = (minutes: number) => 
    new Date(Now().getTime() + minutes * 60 * 1000);


export const getDate = (seconds: number) => new Date(seconds * 1000)

export const getDateInSec = (date: Date) => Math.floor(date.getTime() / 1000)
/**
 * A representation of a period of time.
 */
export class TimeSpan extends Object {
    private _days: number = 0;
    private _hours: number = 0;
    private _minutes: number = 0;
    private _seconds: number = 0;
    private _totalSeconds: number = 0;

    private static minute = 60;
    private static hour = TimeSpan.minute * 60;
    private static day = TimeSpan.hour * 24;

    private constructor(value: number) {
        super();
        this._seconds = value;
        this._totalSeconds = value;
        this.initialize();
    }

    /**
     * Create a new TimeSpan from seconds.
     *  
     * @param {number} seconds - The number of seconds in the time span. 
     * */
    static fromSeconds(seconds: number): TimeSpan {
        return new TimeSpan(seconds);
    }

    /**
     * Try to create a new TimeSpan from seconds.
     *  
     * @param {number} seconds - The number of seconds in the time span. 
     * */
    static tryFromSeconds(seconds?: number | null): TimeSpan | null {
        if (seconds === undefined || seconds === null) {
            return null;
        }

        return TimeSpan.fromSeconds(seconds);
    }

    /**
     * Create a new TimeSpan from hours.
     * 
     * @param hours - The number of hours in the time span.
     * @returns A new TimeSpan.
     */
    static fromHours(hours: number): TimeSpan {
        const seconds = Math.round(hours * TimeSpan.hour);
        return new TimeSpan(seconds);
    }

    private initialize() {
        this._days = Math.floor(this._seconds / TimeSpan.day);
        this._seconds = this._seconds % TimeSpan.day;

        this._hours = Math.floor(this._seconds / TimeSpan.hour);
        this._seconds = this._seconds % TimeSpan.hour;

        this._minutes = Math.floor(this._seconds / TimeSpan.minute);
        this._seconds = this._seconds % TimeSpan.minute;
    }

    /**
     * The number of days in the TimeSpan.
     */
    get days() {
        return this._days;
    }

    /**
     * The number of hours in the TimeSpan.
     */
    get hours() {
        return this._hours;
    }

    /**
     * The number of minutes in the TimeSpan.
     */
    get minutes() {
        return this._minutes;
    }

    /**
     * The number of seconds in the TimeSpan.
     */
    get seconds() {
        return this._seconds;
    }

    get totalSeconds() {
        return this._totalSeconds;
    }

    get totalHours() {
        return this._totalSeconds / TimeSpan.hour;
    }

    override toString(): string {
        let displayValue: string;

        /** Pad the number with leading zeroes for a width of 2. e.g.: 1 becomes '01' */
        const padded = (value: number): string =>
            value
                .toString()
                .padStart(2, "0");

        if (this.days > 0) {
            displayValue = `${this.days}d ${padded(this.hours)}h ${padded(this.minutes)}m ${padded(this.seconds)}s`
        }

        else if (this.hours > 0) {
            displayValue = `${padded(this.hours)}h ${padded(this.minutes)}m ${padded(this.seconds)}s`
        }

        else if (this.minutes > 0) {
            displayValue = `${padded(this.minutes)}m ${padded(this.seconds)}s`
        }

        else {
            displayValue = `${padded(this.seconds)}s`;
        }

        return displayValue;
    }
}


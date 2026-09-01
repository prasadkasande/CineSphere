package com.movieticket.app.dto.show;

/** How a recurring plan steps forward from one screening day to the next. */
public enum RecurrenceFrequency {
    /** Every day, or every N days when an interval is given. */
    DAILY,
    /** Only on the chosen weekdays, every N weeks. */
    WEEKLY
}

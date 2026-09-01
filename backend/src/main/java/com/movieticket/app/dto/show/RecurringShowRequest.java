package com.movieticket.app.dto.show;

import com.movieticket.app.entity.SeatType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * A whole run of screenings described once: which days it lands on, what times
 * it plays each of those days, and how long it keeps running.
 */
public record RecurringShowRequest(
        @NotNull Long movieId,
        @NotNull Long screenId,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        /** One or more start times per screening day, e.g. a matinee and two evening shows. */
        @NotEmpty List<LocalTime> times,
        @NotNull RecurrenceFrequency frequency,
        /** Every N days (DAILY) or every N weeks (WEEKLY). Defaults to 1. */
        @Min(1) @Max(12) Integer interval,
        /** Which weekdays the run plays on. WEEKLY only; ignored for DAILY. */
        Set<DayOfWeek> daysOfWeek,
        @NotEmpty Map<SeatType, BigDecimal> prices
) {
    public int intervalOrDefault() {
        return interval == null || interval < 1 ? 1 : interval;
    }
}

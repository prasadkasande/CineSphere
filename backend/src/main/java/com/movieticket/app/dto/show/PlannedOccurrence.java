package com.movieticket.app.dto.show;

import java.time.LocalDateTime;

/**
 * One screening a recurring plan wants to create, and whether it actually can.
 * The owner sees every one of these before anything is written.
 */
public record PlannedOccurrence(
        LocalDateTime showDateTime,
        LocalDateTime endsAt,
        OccurrenceState state,
        /** Human-readable explanation - only set when the slot is unusable. */
        String reason
) {
    public enum OccurrenceState {
        /** Free slot - this one will be created. */
        READY,
        /** Another screening on this screen overlaps it. */
        CONFLICT,
        /** Already in the past by the time the plan was built. */
        PAST
    }

    public static PlannedOccurrence ready(LocalDateTime start, LocalDateTime end) {
        return new PlannedOccurrence(start, end, OccurrenceState.READY, null);
    }

    public static PlannedOccurrence blocked(LocalDateTime start, LocalDateTime end,
                                            OccurrenceState state, String reason) {
        return new PlannedOccurrence(start, end, state, reason);
    }
}

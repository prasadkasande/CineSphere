package com.movieticket.app.dto.show;

import java.util.List;

/**
 * The dry run of a recurring plan: every slot it would fill, which ones are
 * blocked and why. Returned by the preview endpoint, and again after a commit
 * with {@code created} populated.
 */
public record RecurringShowPlanResponse(
        List<PlannedOccurrence> occurrences,
        int readyCount,
        int conflictCount,
        int pastCount,
        /** Screen time each occurrence occupies: the movie plus the turnaround gap. */
        int slotMins,
        /** Set once the plan is committed - groups the created shows. */
        String seriesId,
        List<ShowResponse> created
) {
    public static RecurringShowPlanResponse preview(List<PlannedOccurrence> occurrences, int slotMins) {
        return new RecurringShowPlanResponse(occurrences, count(occurrences, PlannedOccurrence.OccurrenceState.READY),
                count(occurrences, PlannedOccurrence.OccurrenceState.CONFLICT),
                count(occurrences, PlannedOccurrence.OccurrenceState.PAST),
                slotMins, null, List.of());
    }

    public RecurringShowPlanResponse committed(String seriesId, List<ShowResponse> created) {
        return new RecurringShowPlanResponse(occurrences, readyCount, conflictCount, pastCount,
                slotMins, seriesId, created);
    }

    private static int count(List<PlannedOccurrence> list, PlannedOccurrence.OccurrenceState state) {
        return (int) list.stream().filter(o -> o.state() == state).count();
    }
}

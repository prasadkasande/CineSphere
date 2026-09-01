package com.movieticket.app.dto.stats;

public record CreatorStatsResponse(
        long movieCount,
        long nowShowingCount,
        long upcomingCount,
        long showCount,
        long theatreCount,
        long ticketsSold
) {
}

package com.movieticket.app.dto.stats;

import java.math.BigDecimal;

public record OwnerStatsResponse(
        long theatreCount,
        long approvedTheatreCount,
        long screenCount,
        long upcomingShowCount,
        long totalShowCount,
        long seatsSold,
        BigDecimal revenue,
        double occupancyRate
) {
}

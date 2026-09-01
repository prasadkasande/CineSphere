package com.movieticket.app.dto.stats;

import java.math.BigDecimal;

public record AdminStatsResponse(
        long userCount,
        long customerCount,
        long theatreCount,
        long movieCount,
        long bookingCount,
        long pendingTheatreCount,
        long pendingUserCount,
        long pendingMovieCount,
        BigDecimal platformRevenue
) {
}

package com.movieticket.app.dto.admin;

import java.math.BigDecimal;

/**
 * What an admin is about to destroy. Shown in the confirmation dialog so the
 * decision is made with the refund cost visible up front.
 */
public record DeletionImpactResponse(
        String targetName,
        long confirmedBookings,
        long affectedCustomers,
        BigDecimal refundTotal,
        long showsRemoved,
        long moviesRemoved,
        long theatresRemoved
) {
}

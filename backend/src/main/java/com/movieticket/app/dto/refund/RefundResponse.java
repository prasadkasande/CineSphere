package com.movieticket.app.dto.refund;

import com.movieticket.app.entity.Refund;
import com.movieticket.app.entity.RefundReason;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RefundResponse(
        Long id,
        String movieTitle,
        String theatreName,
        LocalDateTime showDateTime,
        String seats,
        BigDecimal amount,
        RefundReason reason,
        String note,
        String paymentReference,
        LocalDateTime refundedAt
) {
    public static RefundResponse from(Refund r) {
        return new RefundResponse(r.getId(), r.getMovieTitle(), r.getTheatreName(), r.getShowDateTime(),
                r.getSeats(), r.getAmount(), r.getReason(), r.getNote(), r.getPaymentReference(), r.getRefundedAt());
    }
}

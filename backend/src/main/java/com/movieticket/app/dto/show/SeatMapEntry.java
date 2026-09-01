package com.movieticket.app.dto.show;

import com.movieticket.app.entity.SeatType;

import java.math.BigDecimal;

public record SeatMapEntry(
        Long seatId,
        String rowLabel,
        Integer seatNumber,
        SeatType seatType,
        BigDecimal price,
        String status // AVAILABLE, LOCKED, BOOKED
) {
}

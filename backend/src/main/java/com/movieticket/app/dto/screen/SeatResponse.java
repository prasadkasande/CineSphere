package com.movieticket.app.dto.screen;

import com.movieticket.app.entity.Seat;
import com.movieticket.app.entity.SeatType;

public record SeatResponse(
        Long id,
        String rowLabel,
        Integer seatNumber,
        SeatType seatType
) {
    public static SeatResponse from(Seat s) {
        return new SeatResponse(s.getId(), s.getRowLabel(), s.getSeatNumber(), s.getSeatType());
    }
}

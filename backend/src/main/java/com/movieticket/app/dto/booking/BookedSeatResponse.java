package com.movieticket.app.dto.booking;

import com.movieticket.app.entity.BookingSeat;
import com.movieticket.app.entity.SeatType;

import java.math.BigDecimal;

public record BookedSeatResponse(
        Long seatId,
        String rowLabel,
        Integer seatNumber,
        SeatType seatType,
        BigDecimal price
) {
    public static BookedSeatResponse from(BookingSeat bs) {
        return new BookedSeatResponse(
                bs.getSeat().getId(),
                bs.getSeat().getRowLabel(),
                bs.getSeat().getSeatNumber(),
                bs.getSeat().getSeatType(),
                bs.getPrice()
        );
    }
}

package com.movieticket.app.dto.booking;

import com.movieticket.app.entity.Booking;
import com.movieticket.app.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id,
        Long showId,
        String movieTitle,
        String theatreName,
        String screenName,
        LocalDateTime showDateTime,
        LocalDateTime bookingTime,
        BookingStatus status,
        BigDecimal totalAmount,
        List<BookedSeatResponse> seats
) {
    public static BookingResponse from(Booking b) {
        return new BookingResponse(
                b.getId(),
                b.getShow().getId(),
                b.getShow().getMovie().getTitle(),
                b.getShow().getScreen().getTheatre().getName(),
                b.getShow().getScreen().getName(),
                b.getShow().getShowDateTime(),
                b.getBookingTime(),
                b.getStatus(),
                b.getTotalAmount(),
                b.getSeats().stream().map(BookedSeatResponse::from).toList()
        );
    }
}

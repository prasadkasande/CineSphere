package com.movieticket.app.dto.booking;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateBookingRequest(
        @NotNull Long showId,
        @NotEmpty List<Long> seatIds
) {
}

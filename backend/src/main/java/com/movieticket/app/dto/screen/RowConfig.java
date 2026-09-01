package com.movieticket.app.dto.screen;

import com.movieticket.app.entity.SeatType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RowConfig(
        @NotBlank String rowLabel,
        @Positive int seatCount,
        @NotNull SeatType seatType
) {
}

package com.movieticket.app.dto.show;

import com.movieticket.app.entity.SeatType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public record ShowRequest(
        @NotNull Long movieId,
        @NotNull Long screenId,
        @NotNull @Future LocalDateTime showDateTime,
        @NotEmpty Map<SeatType, BigDecimal> prices
) {
}

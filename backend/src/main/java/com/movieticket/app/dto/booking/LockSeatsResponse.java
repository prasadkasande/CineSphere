package com.movieticket.app.dto.booking;

import java.time.LocalDateTime;
import java.util.List;

public record LockSeatsResponse(
        List<Long> lockedSeatIds,
        LocalDateTime expiresAt
) {
}

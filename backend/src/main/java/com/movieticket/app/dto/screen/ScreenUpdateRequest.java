package com.movieticket.app.dto.screen;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * The screen's full desired state: its name and the complete row layout.
 *
 * <p>Rows are reconciled against what already exists rather than wiped and
 * recreated - a Seat's id is referenced by every BookingSeat and SeatLock
 * pointing at it, so seats that survive an edit must keep their identity.
 */
public record ScreenUpdateRequest(
        @NotBlank String name,
        @NotEmpty @Valid List<RowConfig> rows
) {
}

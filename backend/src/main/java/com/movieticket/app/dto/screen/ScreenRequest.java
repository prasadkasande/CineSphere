package com.movieticket.app.dto.screen;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ScreenRequest(
        @NotNull Long theatreId,
        @NotBlank String name,
        @NotEmpty @Valid List<RowConfig> rows
) {
}

package com.movieticket.app.dto.movie;

import com.movieticket.app.entity.MovieStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Bound from multipart/form-data fields via @ModelAttribute on the creator
 * endpoints - the cover image itself travels as a separate file part, not a
 * field on this record.
 */
public record MovieRequest(
        @NotBlank String title,
        String description,
        String genre,
        String language,
        @Positive Integer durationMins,
        String censorRating,
        @NotNull MovieStatus status
) {
}

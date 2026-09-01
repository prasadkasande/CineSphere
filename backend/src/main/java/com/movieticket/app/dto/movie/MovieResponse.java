package com.movieticket.app.dto.movie;

import com.movieticket.app.entity.ApprovalStatus;
import com.movieticket.app.entity.Movie;
import com.movieticket.app.entity.MovieStatus;

public record MovieResponse(
        Long id,
        String title,
        String description,
        String genre,
        String language,
        Integer durationMins,
        String coverImageUrl,
        String censorRating,
        MovieStatus status,
        Long creatorId,
        String creatorName,
        boolean featured,
        int featuredOrder,
        ApprovalStatus approvalStatus,
        /** Non-null only while a title sits REJECTED - shown to its creator. */
        String rejectionReason
) {
    public static MovieResponse from(Movie m) {
        return new MovieResponse(m.getId(), m.getTitle(), m.getDescription(), m.getGenre(), m.getLanguage(),
                m.getDurationMins(), m.getCoverImageUrl(), m.getCensorRating(), m.getStatus(),
                m.getCreator().getId(), m.getCreator().getName(),
                m.isFeatured(), m.getFeaturedOrder(), m.getApprovalStatus(), m.getRejectionReason());
    }
}

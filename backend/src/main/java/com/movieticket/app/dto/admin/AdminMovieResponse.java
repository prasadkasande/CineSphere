package com.movieticket.app.dto.admin;

import com.movieticket.app.entity.ApprovalStatus;
import com.movieticket.app.entity.Movie;
import com.movieticket.app.entity.MovieStatus;

/**
 * Admin view of a movie. Unlike the public catalogue this is never filtered by
 * show availability - the admin has to see (and be able to moderate) titles no
 * theatre has scheduled yet. `upcomingShows` is surfaced so it's obvious why a
 * given title isn't reaching customers.
 */
public record AdminMovieResponse(
        Long id,
        String title,
        String genre,
        String language,
        Integer durationMins,
        String coverImageUrl,
        MovieStatus status,
        ApprovalStatus approvalStatus,
        Long creatorId,
        String creatorName,
        boolean featured,
        int featuredOrder,
        long upcomingShows
) {
    public static AdminMovieResponse from(Movie m, long upcomingShows) {
        return new AdminMovieResponse(
                m.getId(), m.getTitle(), m.getGenre(), m.getLanguage(), m.getDurationMins(),
                m.getCoverImageUrl(), m.getStatus(), m.getApprovalStatus(),
                m.getCreator().getId(), m.getCreator().getName(),
                m.isFeatured(), m.getFeaturedOrder(), upcomingShows);
    }
}

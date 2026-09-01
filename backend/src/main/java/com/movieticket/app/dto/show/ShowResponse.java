package com.movieticket.app.dto.show;

import com.movieticket.app.entity.SeatType;
import com.movieticket.app.entity.Show;
import com.movieticket.app.entity.ShowStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;

public record ShowResponse(
        Long id,
        Long movieId,
        String movieTitle,
        Long screenId,
        String screenName,
        Long theatreId,
        String theatreName,
        String city,
        LocalDateTime showDateTime,
        ShowStatus status,
        /** Non-null when this screening came from a recurring plan. */
        String seriesId,
        Map<SeatType, BigDecimal> prices
) {
    public static ShowResponse from(Show s) {
        return new ShowResponse(
                s.getId(),
                s.getMovie().getId(),
                s.getMovie().getTitle(),
                s.getScreen().getId(),
                s.getScreen().getName(),
                s.getScreen().getTheatre().getId(),
                s.getScreen().getTheatre().getName(),
                s.getScreen().getTheatre().getCity(),
                s.getShowDateTime(),
                s.getStatus(),
                s.getSeriesId(),
                new EnumMap<>(s.getPrices())
        );
    }
}

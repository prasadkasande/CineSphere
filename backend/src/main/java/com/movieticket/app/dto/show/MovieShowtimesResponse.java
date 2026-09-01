package com.movieticket.app.dto.show;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A movie's showtimes as the public page needs them: the screenings inside the
 * browsing window, plus enough context to explain the window itself.
 *
 * @param shows              screenings inside the window, earliest first
 * @param windowDays         how many days the window covers, starting today
 * @param nextShowAfterWindow the first screening beyond the window, or null if
 *                            there is none - lets the page say "next plays
 *                            Thursday" instead of an unqualified "no shows"
 */
public record MovieShowtimesResponse(
        List<ShowResponse> shows,
        int windowDays,
        LocalDateTime nextShowAfterWindow
) {}

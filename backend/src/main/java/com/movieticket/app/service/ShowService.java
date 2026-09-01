package com.movieticket.app.service;

import com.movieticket.app.dto.show.ShowRequest;
import com.movieticket.app.dto.show.MovieShowtimesResponse;
import com.movieticket.app.dto.show.ShowResponse;
import com.movieticket.app.entity.Movie;
import com.movieticket.app.entity.Screen;
import com.movieticket.app.entity.Show;
import com.movieticket.app.entity.ShowStatus;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.exception.ResourceNotFoundException;
import com.movieticket.app.repository.ShowRepository;
import com.movieticket.app.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowService {

    private final ShowRepository showRepository;
    private final MovieService movieService;
    private final ScreenService screenService;
    private final CurrentUser currentUser;

    @Transactional
    public ShowResponse create(ShowRequest request) {
        Movie movie = movieService.findEntity(request.movieId());
        Screen screen = screenService.findEntity(request.screenId());
        screenService.requireOwner(screen.getTheatre());
        requireSchedulable(movie, screen);
        requireFreeSlot(movie, screen, request.showDateTime());

        Show show = Show.builder()
                .movie(movie)
                .screen(screen)
                .showDateTime(request.showDateTime())
                .status(ShowStatus.SCHEDULED)
                .prices(request.prices())
                .build();

        return ShowResponse.from(showRepository.save(show));
    }

    /** Both the one-off and the recurring path must clear these before writing. */
    void requireSchedulable(Movie movie, Screen screen) {
        if (!screen.getTheatre().isApproved()) {
            throw new BadRequestException("Theatre is not yet approved by admin - cannot schedule shows");
        }
        if (movie.getApprovalStatus() != com.movieticket.app.entity.ApprovalStatus.APPROVED) {
            throw new BadRequestException("This movie is still awaiting admin approval - it cannot be scheduled yet");
        }
    }

    /**
     * A screen can only play one thing at a time. The occupied window is the
     * runtime plus the turnaround gap, matching what the recurring planner uses.
     */
    private void requireFreeSlot(Movie movie, Screen screen, LocalDateTime start) {
        int slotMins = RecurringShowService.runtimeOf(movie) + RecurringShowService.TURNAROUND_MINS;
        LocalDateTime end = start.plusMinutes(slotMins);

        for (Show existing : showRepository.findOnScreenFrom(screen.getId(), LocalDateTime.now().minusDays(1))) {
            LocalDateTime otherStart = existing.getShowDateTime();
            LocalDateTime otherEnd = otherStart.plusMinutes(
                    RecurringShowService.runtimeOf(existing.getMovie()) + RecurringShowService.TURNAROUND_MINS);
            if (start.isBefore(otherEnd) && otherStart.isBefore(end)) {
                throw new BadRequestException(String.format(
                        "%s is already playing on %s at %s - screens need a %d minute gap between screenings",
                        existing.getMovie().getTitle(), screen.getName(),
                        otherStart.toLocalTime(), RecurringShowService.TURNAROUND_MINS));
            }
        }
    }

    /** Days of showtimes a customer sees at once, and the ceiling on that. */
    public static final int DEFAULT_WINDOW_DAYS = 2;
    private static final int MAX_WINDOW_DAYS = 14;

    /**
     * Showtimes for the public movie page, bounded to the next {@code days}
     * calendar days. "Next 2 days" means today and tomorrow in full - the
     * window ends at midnight opening day+2, not 48 hours from this instant,
     * so a customer browsing at 23:00 still sees all of tomorrow.
     */
    @Transactional(readOnly = true)
    public MovieShowtimesResponse forMovie(Long movieId, String city, Integer days) {
        int windowDays = Math.clamp(days == null ? DEFAULT_WINDOW_DAYS : days, 1, MAX_WINDOW_DAYS);
        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.toLocalDate().plusDays(windowDays).atStartOfDay();

        List<ShowResponse> shows = showRepository
                .findShowsForMovieInWindow(movieId, city, from, to)
                .stream().map(ShowResponse::from).toList();

        // Only worth a second query when there is nothing to show in the window.
        LocalDateTime nextAfter = shows.isEmpty()
                ? showRepository.findNextShowTime(movieId, city, to)
                : null;

        return new MovieShowtimesResponse(shows, windowDays, nextAfter);
    }

    @Transactional(readOnly = true)
    public List<ShowResponse> myShows() {
        return showRepository.findByScreen_Theatre_Owner_Id(currentUser.id())
                .stream().map(ShowResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ShowResponse get(Long id) {
        return ShowResponse.from(findEntity(id));
    }

    Show findEntity(Long id) {
        return showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found: " + id));
    }
}

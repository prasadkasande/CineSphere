package com.movieticket.app.service;

import com.movieticket.app.dto.show.PlannedOccurrence;
import com.movieticket.app.dto.show.PlannedOccurrence.OccurrenceState;
import com.movieticket.app.dto.show.RecurrenceFrequency;
import com.movieticket.app.dto.show.RecurringShowPlanResponse;
import com.movieticket.app.dto.show.RecurringShowRequest;
import com.movieticket.app.dto.show.ShowResponse;
import com.movieticket.app.entity.Movie;
import com.movieticket.app.entity.Screen;
import com.movieticket.app.entity.Show;
import com.movieticket.app.entity.ShowStatus;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.repository.ShowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Turns "this movie, every Friday and Saturday at 6 and 9, until the end of the
 * month" into concrete screenings.
 *
 * <p>Nothing is written until the owner has seen the plan: {@link #preview} and
 * {@link #create} run the exact same generator, so what the owner approves is
 * what gets saved. Slots that clash with an existing screening on the same
 * screen are reported rather than silently dropped or forced through.
 */
@Service
@RequiredArgsConstructor
public class RecurringShowService {

    /** Cleaning and audience turnover between two screenings on one screen. */
    static final int TURNAROUND_MINS = 20;
    /** Used when a movie has no runtime recorded - roughly a feature length. */
    static final int ASSUMED_RUNTIME_MINS = 130;
    /** A plan may not reach further out than this. */
    static final int MAX_HORIZON_DAYS = 180;
    /** Upper bound on one plan, so a stray interval can't create thousands of rows. */
    static final int MAX_OCCURRENCES = 300;

    private final ShowRepository showRepository;
    private final MovieService movieService;
    private final ScreenService screenService;
    private final ShowService showService;

    @Transactional(readOnly = true)
    public RecurringShowPlanResponse preview(RecurringShowRequest request) {
        return buildPlan(request).response();
    }

    @Transactional
    public RecurringShowPlanResponse create(RecurringShowRequest request) {
        Plan plan = buildPlan(request);
        if (plan.response().readyCount() == 0) {
            throw new BadRequestException(
                    "This plan has no free slots - every screening it generates is in the past or clashes with an existing show");
        }

        String seriesId = UUID.randomUUID().toString();
        List<ShowResponse> created = new ArrayList<>();
        for (PlannedOccurrence occurrence : plan.response().occurrences()) {
            if (occurrence.state() != OccurrenceState.READY) continue;
            Show show = showRepository.save(Show.builder()
                    .movie(plan.movie())
                    .screen(plan.screen())
                    .showDateTime(occurrence.showDateTime())
                    .status(ShowStatus.SCHEDULED)
                    .seriesId(seriesId)
                    .prices(request.prices())
                    .build());
            created.add(ShowResponse.from(show));
        }
        return plan.response().committed(seriesId, created);
    }

    /* ---------- generation ---------- */

    private Plan buildPlan(RecurringShowRequest request) {
        Movie movie = movieService.findEntity(request.movieId());
        Screen screen = screenService.findEntity(request.screenId());
        screenService.requireOwner(screen.getTheatre());
        showService.requireSchedulable(movie, screen);

        validateWindow(request);

        int slotMins = runtimeOf(movie) + TURNAROUND_MINS;
        List<LocalDate> dates = datesFor(request);
        List<LocalTime> times = request.times().stream().distinct().sorted().toList();

        if ((long) dates.size() * times.size() > MAX_OCCURRENCES) {
            throw new BadRequestException("That plan would create " + (dates.size() * times.size())
                    + " screenings. Shorten the run or reduce the daily show times (limit " + MAX_OCCURRENCES + ").");
        }

        // Existing screenings on this screen, fetched once for the whole plan.
        LocalDateTime now = LocalDateTime.now();
        List<Booking> occupied = new ArrayList<>();
        for (Show existing : showRepository.findOnScreenFrom(screen.getId(), now.minusDays(1))) {
            occupied.add(new Booking(existing.getShowDateTime(),
                    existing.getShowDateTime().plusMinutes(runtimeOf(existing.getMovie()) + TURNAROUND_MINS),
                    existing.getMovie().getTitle()));
        }

        List<PlannedOccurrence> occurrences = new ArrayList<>();
        for (LocalDate date : dates) {
            for (LocalTime time : times) {
                LocalDateTime start = LocalDateTime.of(date, time);
                LocalDateTime end = start.plusMinutes(slotMins);

                if (!start.isAfter(now)) {
                    occurrences.add(PlannedOccurrence.blocked(start, end, OccurrenceState.PAST,
                            "Already past"));
                    continue;
                }
                Booking clash = occupied.stream()
                        .filter(b -> b.overlaps(start, end))
                        .findFirst()
                        .orElse(null);
                if (clash != null) {
                    occurrences.add(PlannedOccurrence.blocked(start, end, OccurrenceState.CONFLICT,
                            "Screen busy with " + clash.title()));
                    continue;
                }
                occurrences.add(PlannedOccurrence.ready(start, end));
                // Later occurrences in this same plan must not land on it either.
                occupied.add(new Booking(start, end, movie.getTitle()));
            }
        }

        occurrences.sort(Comparator.comparing(PlannedOccurrence::showDateTime));
        return new Plan(movie, screen, RecurringShowPlanResponse.preview(occurrences, slotMins));
    }

    private void validateWindow(RecurringShowRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new BadRequestException("The run's end date is before its start date");
        }
        long span = ChronoUnit.DAYS.between(request.startDate(), request.endDate());
        if (span > MAX_HORIZON_DAYS) {
            throw new BadRequestException("A recurring run can cover at most " + MAX_HORIZON_DAYS + " days");
        }
        if (request.frequency() == RecurrenceFrequency.WEEKLY
                && (request.daysOfWeek() == null || request.daysOfWeek().isEmpty())) {
            throw new BadRequestException("Pick at least one weekday for a weekly run");
        }
    }

    /** The calendar days a plan lands on, before times of day are applied. */
    private List<LocalDate> datesFor(RecurringShowRequest request) {
        int interval = request.intervalOrDefault();
        List<LocalDate> dates = new ArrayList<>();

        for (LocalDate date = request.startDate();
             !date.isAfter(request.endDate());
             date = date.plusDays(1)) {

            boolean included = switch (request.frequency()) {
                case DAILY -> ChronoUnit.DAYS.between(request.startDate(), date) % interval == 0;
                // Weeks are counted from the start date's own week, so "every
                // other Friday" stays in step with the week the owner picked.
                case WEEKLY -> request.daysOfWeek().contains(date.getDayOfWeek())
                        && ChronoUnit.WEEKS.between(
                                request.startDate().with(java.time.DayOfWeek.MONDAY),
                                date.with(java.time.DayOfWeek.MONDAY)) % interval == 0;
            };
            if (included) dates.add(date);
        }
        return dates;
    }

    static int runtimeOf(Movie movie) {
        Integer mins = movie.getDurationMins();
        return mins == null || mins <= 0 ? ASSUMED_RUNTIME_MINS : mins;
    }

    /** A stretch of screen time that is already spoken for. */
    private record Booking(LocalDateTime start, LocalDateTime end, String title) {
        boolean overlaps(LocalDateTime otherStart, LocalDateTime otherEnd) {
            return start.isBefore(otherEnd) && otherStart.isBefore(end);
        }
    }

    private record Plan(Movie movie, Screen screen, RecurringShowPlanResponse response) {
    }
}

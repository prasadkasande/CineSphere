package com.movieticket.app;

import com.movieticket.app.dto.show.MovieShowtimesResponse;
import com.movieticket.app.entity.*;
import com.movieticket.app.repository.*;
import com.movieticket.app.service.ShowService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:windowtest;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional
class ShowWindowTest {

    @Autowired ShowService showService;
    @Autowired ShowRepository showRepository;
    @Autowired MovieRepository movieRepository;
    @Autowired ScreenRepository screenRepository;
    @Autowired TheatreRepository theatreRepository;
    @Autowired UserRepository userRepository;

    private Show showAt(Movie movie, Screen screen, LocalDateTime when) {
        Show s = new Show();
        s.setMovie(movie);
        s.setScreen(screen);
        s.setShowDateTime(when);
        s.setStatus(ShowStatus.SCHEDULED);
        Map<SeatType, BigDecimal> prices = new EnumMap<>(SeatType.class);
        prices.put(SeatType.SILVER, new BigDecimal("12.00"));
        prices.put(SeatType.GOLD, new BigDecimal("18.00"));
        s.setPrices(prices);
        return showRepository.save(s);
    }

    private record Fixture(Movie movie, Screen screen) {}

    private Fixture fixture(String title) {
        User owner = userRepository.findByEmail("owner@movieticket.com").orElseThrow();
        User creator = userRepository.findByEmail("creator@movieticket.com").orElseThrow();

        Theatre t = new Theatre();
        t.setName("Window Test Theatre " + title);
        t.setCity("Testville");
        t.setAddress("1 Test Road");
        t.setOwner(owner);
        t.setApproved(true);
        t = theatreRepository.save(t);

        Screen sc = new Screen();
        sc.setName("Screen 1");
        sc.setTheatre(t);
        sc = screenRepository.save(sc);

        Movie m = new Movie();
        m.setTitle(title);
        m.setGenre("Drama");
        m.setLanguage("English");
        m.setDurationMins(100);
        m.setCensorRating("U");
        m.setStatus(MovieStatus.NOW_SHOWING);
        m.setApprovalStatus(ApprovalStatus.APPROVED);
        m.setCreator(creator);
        m = movieRepository.save(m);

        return new Fixture(m, sc);
    }

    /**
     * "Next 2 days" must mean today and tomorrow in full, not 48 hours from
     * this instant - otherwise a customer browsing at 23:00 loses most of
     * tomorrow's listings.
     */
    @Test
    void windowCoversTodayAndTomorrowInFullButNotTheDayAfter() {
        Fixture f = fixture("Window Boundaries");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrowLate = now.toLocalDate().plusDays(1).atTime(23, 30);
        LocalDateTime dayAfterEarly = now.toLocalDate().plusDays(2).atTime(0, 30);

        showAt(f.movie(), f.screen(), now.plusHours(2));   // today
        showAt(f.movie(), f.screen(), tomorrowLate);       // tomorrow, 23:30
        showAt(f.movie(), f.screen(), dayAfterEarly);      // day after, 00:30

        MovieShowtimesResponse res = showService.forMovie(f.movie().getId(), null, null);

        assertThat(res.windowDays()).isEqualTo(2);
        assertThat(res.shows()).hasSize(2);
        assertThat(res.shows().get(1).showDateTime()).isEqualTo(tomorrowLate);
        // Day-after show is outside the window; the window wasn't empty, so we
        // deliberately don't pay for the "next show" query.
        assertThat(res.nextShowAfterWindow()).isNull();
    }

    /** A past show and a COMPLETED one must never reach a customer. */
    @Test
    void excludesPastAndNonScheduledShows() {
        Fixture f = fixture("Window Exclusions");
        LocalDateTime now = LocalDateTime.now();

        showAt(f.movie(), f.screen(), now.minusHours(3));                       // already started
        Show completed = showAt(f.movie(), f.screen(), now.plusHours(4));
        completed.setStatus(ShowStatus.COMPLETED);
        showRepository.save(completed);
        showAt(f.movie(), f.screen(), now.plusHours(6));                        // the only valid one

        MovieShowtimesResponse res = showService.forMovie(f.movie().getId(), null, null);
        assertThat(res.shows()).hasSize(1);
        assertThat(res.shows().get(0).showDateTime()).isEqualTo(now.plusHours(6));
    }

    /**
     * The empty case is the one that would otherwise look broken - exercises
     * the `min(showDateTime)` projection, whose LocalDateTime return type only
     * fails at execution, not at startup.
     */
    @Test
    void emptyWindowReportsWhenTheFilmNextPlays() {
        Fixture f = fixture("Window Empty");
        LocalDateTime farOff = LocalDateTime.now().toLocalDate().plusDays(6).atTime(19, 0);
        showAt(f.movie(), f.screen(), farOff);

        MovieShowtimesResponse res = showService.forMovie(f.movie().getId(), null, null);

        assertThat(res.shows()).isEmpty();
        assertThat(res.nextShowAfterWindow()).isEqualTo(farOff);
    }

    /** No shows at all: the projection must return null, not blow up. */
    @Test
    void noShowsAtAllReturnsNullRatherThanFailing() {
        Fixture f = fixture("Window None");
        MovieShowtimesResponse res = showService.forMovie(f.movie().getId(), null, null);
        assertThat(res.shows()).isEmpty();
        assertThat(res.nextShowAfterWindow()).isNull();
    }

    /** The caller-supplied window is clamped, so ?days=999 can't dump the DB. */
    @Test
    void windowIsClamped() {
        Fixture f = fixture("Window Clamp");
        assertThat(showService.forMovie(f.movie().getId(), null, 999).windowDays()).isEqualTo(14);
        assertThat(showService.forMovie(f.movie().getId(), null, 0).windowDays()).isEqualTo(1);
        assertThat(showService.forMovie(f.movie().getId(), null, 5).windowDays()).isEqualTo(5);
    }

    /** City filtering happens in the same query as the window. */
    @Test
    void cityFilterAppliesWithinTheWindow() {
        Fixture f = fixture("Window City");
        showAt(f.movie(), f.screen(), LocalDateTime.now().plusHours(3));

        assertThat(showService.forMovie(f.movie().getId(), "Testville", null).shows()).hasSize(1);
        assertThat(showService.forMovie(f.movie().getId(), "testville", null).shows()).hasSize(1);
        List<?> elsewhere = showService.forMovie(f.movie().getId(), "Nowhere", null).shows();
        assertThat(elsewhere).isEmpty();
    }
}

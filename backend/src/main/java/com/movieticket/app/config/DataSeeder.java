package com.movieticket.app.config;

import com.movieticket.app.entity.*;
import com.movieticket.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds an admin account plus a small demo dataset (owner, theatre, screen,
 * movies, a show) on first run so the frontend has something to show
 * immediately. Controlled by app.seed.enabled - safe to leave on since every
 * step is guarded by an existence check.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final TheatreRepository theatreRepository;
    private final ScreenRepository screenRepository;
    private final SeatRepository seatRepository;
    private final ShowRepository showRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.seed.admin-email}")
    private String adminEmail;

    @Value("${app.seed.admin-password}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        if (!userRepository.existsByEmail(adminEmail)) {
            userRepository.save(User.builder()
                    .name("Platform Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build());
            log.info("Seeded admin account: {}", adminEmail);
        }

        User creator = userRepository.findByEmail("creator@movieticket.com").orElse(null);
        if (creator == null) {
            creator = userRepository.save(User.builder()
                    .name("Demo Movie Creator")
                    .email("creator@movieticket.com")
                    .password(passwordEncoder.encode("Creator@123"))
                    .role(Role.MOVIE_CREATOR)
                    .enabled(true)
                    .build());
            log.info("Seeded movie creator account: creator@movieticket.com");
        }

        if (movieRepository.count() == 0) {
            movieRepository.saveAll(List.of(
                    Movie.builder().title("Galactic Drift").description("A crew races across the galaxy to stop a dying star from taking a colony with it.")
                            .genre("Sci-Fi").language("English").durationMins(128).coverImageUrl("https://picsum.photos/seed/galactic/400/600")
                            .censorRating("PG-13").status(MovieStatus.NOW_SHOWING).creator(creator).build(),
                    Movie.builder().title("Paper Lanterns").description("Three childhood friends reunite for one last festival before the town is demolished.")
                            .genre("Drama").language("English").durationMins(104).coverImageUrl("https://picsum.photos/seed/lanterns/400/600")
                            .censorRating("PG").status(MovieStatus.NOW_SHOWING).creator(creator).build(),
                    Movie.builder().title("Midnight Circuit").description("A getaway driver gets pulled into one final, impossible heist.")
                            .genre("Action").language("English").durationMins(112).coverImageUrl("https://picsum.photos/seed/circuit/400/600")
                            .censorRating("R").status(MovieStatus.NOW_SHOWING).creator(creator).build(),
                    Movie.builder().title("The Quiet Orchard").description("A retired botanist discovers something impossible growing in her greenhouse.")
                            .genre("Fantasy").language("English").durationMins(118).coverImageUrl("https://picsum.photos/seed/orchard/400/600")
                            .censorRating("PG").status(MovieStatus.UPCOMING).creator(creator).build()
            ));
            log.info("Seeded starter movies");
        }

        if (!userRepository.existsByEmail("owner@movieticket.com")) {
            User owner = userRepository.save(User.builder()
                    .name("Demo Theatre Owner")
                    .email("owner@movieticket.com")
                    .password(passwordEncoder.encode("Owner@123"))
                    .role(Role.THEATRE_OWNER)
                    .enabled(true)
                    .build());

            Theatre theatre = theatreRepository.save(Theatre.builder()
                    .name("Skyline Cinemas")
                    .city("Springfield")
                    .address("100 Main Street, Springfield")
                    .owner(owner)
                    .approved(true)
                    .build());

            Screen screen = screenRepository.save(Screen.builder()
                    .name("Screen 1")
                    .theatre(theatre)
                    .build());

            for (String row : List.of("A", "B", "C")) {
                SeatType type = row.equals("C") ? SeatType.RECLINER : row.equals("B") ? SeatType.GOLD : SeatType.SILVER;
                for (int n = 1; n <= 8; n++) {
                    seatRepository.save(Seat.builder().screen(screen).rowLabel(row).seatNumber(n).seatType(type).build());
                }
            }

            Movie firstMovie = movieRepository.findByStatusAndApprovalStatus(MovieStatus.NOW_SHOWING, ApprovalStatus.APPROVED).get(0);
            showRepository.save(Show.builder()
                    .movie(firstMovie)
                    .screen(screen)
                    .showDateTime(LocalDateTime.now().plusDays(1).withHour(19).withMinute(0).withSecond(0).withNano(0))
                    .status(ShowStatus.SCHEDULED)
                    .prices(java.util.Map.of(
                            SeatType.SILVER, new BigDecimal("8.00"),
                            SeatType.GOLD, new BigDecimal("12.00"),
                            SeatType.RECLINER, new BigDecimal("18.00")
                    ))
                    .build());

            log.info("Seeded theatre owner account: owner@movieticket.com, with an approved theatre and show");
        }

        if (!userRepository.existsByEmail("customer@movieticket.com")) {
            userRepository.save(User.builder()
                    .name("Demo Customer")
                    .email("customer@movieticket.com")
                    .password(passwordEncoder.encode("Customer@123"))
                    .role(Role.CUSTOMER)
                    .enabled(true)
                    .build());
            log.info("Seeded customer account: customer@movieticket.com");
        }
    }
}

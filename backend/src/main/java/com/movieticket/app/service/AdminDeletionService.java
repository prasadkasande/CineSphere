package com.movieticket.app.service;

import com.movieticket.app.dto.admin.DeletionImpactResponse;
import com.movieticket.app.entity.*;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.exception.ResourceNotFoundException;
import com.movieticket.app.repository.*;
import com.movieticket.app.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin-only cascading deletes.
 *
 * Removing a movie/theatre/account has to clear a chain of foreign keys, and
 * may invalidate tickets customers have already paid for. Rather than blocking
 * on that, the flow is: preview the impact (how many bookings, how much money),
 * then on confirmation refund every affected ticket via {@link CascadeDeletionSupport},
 * and only then delete.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDeletionService {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final TheatreRepository theatreRepository;
    private final ShowRepository showRepository;
    private final SeatLockRepository seatLockRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final RefundRepository refundRepository;
    private final CascadeDeletionSupport cascade;
    private final CurrentUser currentUser;

    /* ---------------- impact preview ---------------- */

    @Transactional(readOnly = true)
    public DeletionImpactResponse movieImpact(Long movieId) {
        Movie movie = requireMovie(movieId);
        List<Booking> affected = bookingRepository.findConfirmedForMovie(movieId);
        return cascade.impact(movie.getTitle(), affected, showRepository.findByMovie_Id(movieId).size(), 1, 0);
    }

    @Transactional(readOnly = true)
    public DeletionImpactResponse theatreImpact(Long theatreId) {
        Theatre theatre = requireTheatre(theatreId);
        List<Booking> affected = bookingRepository.findConfirmedForTheatre(theatreId);
        return cascade.impact(theatre.getName(), affected, showRepository.findByScreen_Theatre_Id(theatreId).size(), 0, 1);
    }

    @Transactional(readOnly = true)
    public DeletionImpactResponse userImpact(Long userId) {
        User user = requireUser(userId);
        return switch (user.getRole()) {
            case THEATRE_OWNER -> {
                List<Booking> affected = bookingRepository.findConfirmedForOwner(userId);
                List<Theatre> theatres = theatreRepository.findByOwner_Id(userId);
                long shows = theatres.stream()
                        .mapToLong(t -> showRepository.findByScreen_Theatre_Id(t.getId()).size()).sum();
                yield cascade.impact(user.getName(), affected, shows, 0, theatres.size());
            }
            case MOVIE_CREATOR -> {
                List<Booking> affected = bookingRepository.findConfirmedForCreator(userId);
                yield cascade.impact(user.getName(), affected,
                        showRepository.findByMovie_Creator_Id(userId).size(),
                        movieRepository.findByCreator(user).size(), 0);
            }
            default -> cascade.impact(user.getName(), List.of(), 0, 0, 0);
        };
    }

    /* ---------------- deletes ---------------- */

    @Transactional
    public void deleteMovie(Long movieId, String note) {
        Movie movie = requireMovie(movieId);
        cascade.refundAll(bookingRepository.findConfirmedForMovie(movieId), RefundReason.MOVIE_REMOVED, note);
        showRepository.findByMovie_Id(movieId).forEach(cascade::purgeShow);
        movieRepository.deleteByIdInBulk(movieId);
        log.info("Admin deleted movie '{}' (id {})", movie.getTitle(), movieId);
    }

    @Transactional
    public void deleteTheatre(Long theatreId, String note) {
        Theatre theatre = requireTheatre(theatreId);
        cascade.refundAll(bookingRepository.findConfirmedForTheatre(theatreId), RefundReason.THEATRE_REMOVED, note);
        cascade.purgeTheatre(theatre);
        log.info("Admin deleted theatre '{}' (id {})", theatre.getName(), theatreId);
    }

    @Transactional
    public void deleteUser(Long userId, String note) {
        User user = requireUser(userId);

        if (user.getId().equals(currentUser.id())) {
            throw new BadRequestException("You can't delete your own admin account");
        }
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts can't be deleted");
        }

        switch (user.getRole()) {
            case THEATRE_OWNER -> {
                cascade.refundAll(bookingRepository.findConfirmedForOwner(userId), RefundReason.ACCOUNT_REMOVED, note);
                theatreRepository.findByOwner_Id(userId).forEach(cascade::purgeTheatre);
            }
            case MOVIE_CREATOR -> {
                cascade.refundAll(bookingRepository.findConfirmedForCreator(userId), RefundReason.ACCOUNT_REMOVED, note);
                showRepository.findByMovie_Creator_Id(userId).forEach(cascade::purgeShow);
                movieRepository.findByCreator(user).forEach(m -> movieRepository.deleteByIdInBulk(m.getId()));
            }
            case CUSTOMER -> {
                // The customer's own tickets go with the account; no refund owed
                // to a third party, but their refund history stays as an audit row.
                bookingSeatRepository.deleteByBookingUser(userId);
                bookingRepository.deleteByUserId(userId);
            }
            default -> { /* unreachable - guarded above */ }
        }

        refundRepository.detachFromUser(userId);
        seatLockRepository.deleteByLockedBy(userId);
        userRepository.deleteByIdInBulk(userId);
        log.info("Admin deleted {} account '{}' (id {})", user.getRole(), user.getName(), userId);
    }

    /* ---------------- lookups ---------------- */

    private Movie requireMovie(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found: " + id));
    }

    private Theatre requireTheatre(Long id) {
        return theatreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Theatre not found: " + id));
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
}

package com.movieticket.app.service;

import com.movieticket.app.dto.admin.DeletionImpactResponse;
import com.movieticket.app.entity.*;
import com.movieticket.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * The cascade-delete-with-refund mechanics shared by every "destroy this and
 * everything under it" flow, whether an admin removes a movie/theatre/account
 * or an owner closes their own theatre or screen: refund every confirmed
 * booking a delete would otherwise orphan, write a durable {@link Refund} row
 * the customer can still see afterwards, then clear the foreign-key chain in
 * dependency order before deleting the row itself.
 *
 * <p>Callers own authorization (admin-only vs. the current owner's own
 * records) and decide which {@link RefundReason} applies - this class only
 * knows how to purge.
 *
 * <p>Every delete here - Show, Screen, Theatre - goes through a bulk
 * {@code delete from X where id = :id} query, never {@code repository.delete(entity)}.
 * {@link #refundAll} lazily loads a Booking's Seat (via {@code bs.getSeat()})
 * before it loads that Booking's Show/Screen, and once both are in the
 * session, deleting the Screen as a tracked entity makes Hibernate's
 * flush-time cascade check re-validate the still-session-cached Seat's
 * {@code screen} association against it - and since the Seat's own row was
 * already removed by an earlier bulk delete without evicting it from the
 * session, Hibernate throws a spurious "unsaved transient instance" for a row
 * that was never transient at all. A bulk delete never enters that cascade
 * check, so it never hits this.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CascadeDeletionSupport {

    private final TheatreRepository theatreRepository;
    private final ScreenRepository screenRepository;
    private final SeatRepository seatRepository;
    private final ShowRepository showRepository;
    private final SeatLockRepository seatLockRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final RefundRepository refundRepository;
    private final MockPaymentService paymentService;

    DeletionImpactResponse impact(String targetName, List<Booking> bookings,
                                  long shows, long movies, long theatres) {
        BigDecimal total = bookings.stream()
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long customers = bookings.stream().map(b -> b.getUser().getId()).distinct().count();
        return new DeletionImpactResponse(targetName, bookings.size(), customers, total, shows, movies, theatres);
    }

    /**
     * Cancels and refunds each booking, leaving a Refund row behind that
     * outlives the movie/show/screen being deleted.
     */
    void refundAll(List<Booking> bookings, RefundReason reason, String note) {
        for (Booking booking : bookings) {
            Show show = booking.getShow();
            String seatList = booking.getSeats().stream()
                    .map(bs -> bs.getSeat().getRowLabel() + bs.getSeat().getSeatNumber())
                    .collect(Collectors.joining(", "));

            String reference = paymentService.refund(
                    booking.getTotalAmount(), "Refund for booking " + booking.getId());

            refundRepository.save(Refund.builder()
                    .user(booking.getUser())
                    .customerEmail(booking.getUser().getEmail())
                    .movieTitle(show.getMovie().getTitle())
                    .theatreName(show.getScreen().getTheatre().getName())
                    .showDateTime(show.getShowDateTime())
                    .seats(seatList)
                    .amount(booking.getTotalAmount())
                    .reason(reason)
                    .note(note)
                    .paymentReference(reference)
                    .refundedAt(LocalDateTime.now())
                    .build());

            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
        }
        if (!bookings.isEmpty()) {
            log.info("Refunded {} booking(s) for reason {}", bookings.size(), reason);
        }
    }

    void purgeShow(Show show) {
        Long showId = show.getId();
        seatLockRepository.deleteByShowId(showId);
        bookingSeatRepository.deleteByShowId(showId);
        bookingRepository.deleteByShowId(showId);
        showRepository.deleteByIdInBulk(showId);
    }

    void purgeTheatre(Theatre theatre) {
        Long theatreId = theatre.getId();
        showRepository.findByScreen_Theatre_Id(theatreId).forEach(this::purgeShow);

        for (Screen screen : screenRepository.findByTheatre_Id(theatreId)) {
            // Locks reference seats, so they must go before the seats do.
            seatLockRepository.deleteByScreenId(screen.getId());
            seatRepository.deleteByScreenId(screen.getId());
        }
        screenRepository.deleteByTheatreIdInBulk(theatreId);
        theatreRepository.deleteByIdInBulk(theatreId);
    }

    /** A single screen closes; its theatre and other screens are untouched. */
    void purgeScreen(Screen screen) {
        Long screenId = screen.getId();
        showRepository.findByScreen_Id(screenId).forEach(this::purgeShow);
        seatLockRepository.deleteByScreenId(screenId);
        seatRepository.deleteByScreenId(screenId);
        screenRepository.deleteByIdInBulk(screenId);
    }
}

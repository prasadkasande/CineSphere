package com.movieticket.app.service;

import com.movieticket.app.dto.admin.DeletionImpactResponse;
import com.movieticket.app.entity.RefundReason;
import com.movieticket.app.entity.Screen;
import com.movieticket.app.entity.Theatre;
import com.movieticket.app.repository.BookingRepository;
import com.movieticket.app.repository.ShowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lets a theatre owner close one of their own theatres or retire a single
 * screen - rarely used, but the only way to correct a registration or free up
 * a screen for rebuilding once it has live bookings against it. Ownership is
 * checked before anything else; the actual refund-and-purge mechanics are
 * {@link CascadeDeletionSupport}, the same code path admin deletions use.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OwnerDeletionService {

    private final TheatreService theatreService;
    private final ScreenService screenService;
    private final BookingRepository bookingRepository;
    private final ShowRepository showRepository;
    private final CascadeDeletionSupport cascade;

    @Transactional(readOnly = true)
    public DeletionImpactResponse theatreImpact(Long theatreId) {
        Theatre theatre = theatreService.findEntity(theatreId);
        theatreService.requireOwner(theatre);
        var affected = bookingRepository.findConfirmedForTheatre(theatreId);
        return cascade.impact(theatre.getName(), affected,
                showRepository.findByScreen_Theatre_Id(theatreId).size(), 0, 1);
    }

    @Transactional
    public void deleteTheatre(Long theatreId, String note) {
        Theatre theatre = theatreService.findEntity(theatreId);
        theatreService.requireOwner(theatre);

        cascade.refundAll(bookingRepository.findConfirmedForTheatre(theatreId), RefundReason.THEATRE_REMOVED,
                note == null || note.isBlank() ? "Closed by theatre owner" : note);
        cascade.purgeTheatre(theatre);
        log.info("Owner closed theatre '{}' (id {})", theatre.getName(), theatreId);
    }

    @Transactional(readOnly = true)
    public DeletionImpactResponse screenImpact(Long screenId) {
        Screen screen = screenService.findEntity(screenId);
        screenService.requireOwner(screen.getTheatre());
        var affected = bookingRepository.findConfirmedForScreen(screenId);
        return cascade.impact(screen.getName(), affected, showRepository.findByScreen_Id(screen.getId()).size(), 0, 0);
    }

    @Transactional
    public void deleteScreen(Long screenId, String note) {
        Screen screen = screenService.findEntity(screenId);
        screenService.requireOwner(screen.getTheatre());

        cascade.refundAll(bookingRepository.findConfirmedForScreen(screenId), RefundReason.SCREEN_REMOVED,
                note == null || note.isBlank() ? "Screen removed by theatre owner" : note);
        cascade.purgeScreen(screen);
        log.info("Owner removed screen '{}' (id {})", screen.getName(), screenId);
    }
}

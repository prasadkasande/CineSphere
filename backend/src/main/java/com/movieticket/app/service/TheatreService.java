package com.movieticket.app.service;

import com.movieticket.app.dto.theatre.TheatreRequest;
import com.movieticket.app.dto.theatre.TheatreResponse;
import com.movieticket.app.entity.Screen;
import com.movieticket.app.entity.Theatre;
import com.movieticket.app.entity.User;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.exception.ResourceNotFoundException;
import com.movieticket.app.repository.ScreenRepository;
import com.movieticket.app.repository.TheatreRepository;
import com.movieticket.app.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TheatreService {

    private final TheatreRepository theatreRepository;
    private final ScreenRepository screenRepository;
    private final CascadeDeletionSupport cascade;
    private final CurrentUser currentUser;

    @Transactional
    public TheatreResponse create(TheatreRequest request) {
        User owner = currentUser.entity();
        Theatre theatre = Theatre.builder()
                .name(request.name())
                .city(request.city())
                .address(request.address())
                .phone(request.phone())
                .pincode(request.pincode())
                .description(request.description())
                .owner(owner)
                .approved(false)
                .build();
        return TheatreResponse.from(theatreRepository.save(theatre));
    }

    /**
     * Editing never touches {@code approved} - the same call an owner makes to
     * fix a typo in the address must not silently pull a live theatre (and every
     * show under it) back into the approval queue.
     */
    @Transactional
    public TheatreResponse update(Long id, TheatreRequest request) {
        Theatre theatre = findEntity(id);
        requireOwner(theatre);

        theatre.setName(request.name());
        theatre.setCity(request.city());
        theatre.setAddress(request.address());
        theatre.setPhone(request.phone());
        theatre.setPincode(request.pincode());
        theatre.setDescription(request.description());
        return TheatreResponse.from(theatreRepository.save(theatre));
    }

    /**
     * Applies to a rejected registration after the owner has addressed the
     * admin's note: files a brand new application with the corrected details
     * and drops the rejected one.
     *
     * <p>A fresh row rather than un-rejecting the old one, so the resubmission
     * is genuinely a new application with its own clean state - but any screens
     * the owner already laid out move across first. A rejected theatre was
     * never approved (see {@link #reject}), so shows and bookings can't exist
     * against it and nothing else is at stake.
     */
    @Transactional
    public TheatreResponse resubmit(Long id, TheatreRequest request) {
        Theatre rejected = findEntity(id);
        requireOwner(rejected);

        if (!rejected.isRejected()) {
            throw new BadRequestException("Only a rejected registration can be resent for approval");
        }

        Theatre replacement = theatreRepository.save(Theatre.builder()
                .name(request.name())
                .city(request.city())
                .address(request.address())
                .phone(request.phone())
                .pincode(request.pincode())
                .description(request.description())
                .owner(rejected.getOwner())
                .approved(false)
                .build());

        // Carry the seat layouts over - the owner built them, and the old
        // registration is about to be purged with everything under it.
        List<Screen> screens = screenRepository.findByTheatre_Id(rejected.getId());
        for (Screen screen : screens) {
            screen.setTheatre(replacement);
        }
        screenRepository.saveAll(screens);

        cascade.purgeTheatre(rejected);
        return TheatreResponse.from(replacement);
    }

    void requireOwner(Theatre theatre) {
        if (!theatre.getOwner().getId().equals(currentUser.id())) {
            throw new AccessDeniedException("You do not own this theatre");
        }
    }

    /**
     * The owner's own list - and the moment a rejection is "seen". Stamping it
     * here starts the purge clock, so the message can't be missed by an owner
     * who doesn't look for an hour.
     */
    @Transactional
    public List<TheatreResponse> myTheatres() {
        User owner = currentUser.entity();
        List<Theatre> mine = theatreRepository.findByOwner(owner);

        for (Theatre t : mine) {
            if (t.isRejected() && t.getRejectionSeenAt() == null) {
                t.setRejectionSeenAt(LocalDateTime.now());
                theatreRepository.save(t);
            }
        }
        return mine.stream().map(TheatreResponse::from).toList();
    }

    /** Awaiting a decision - excludes registrations already sent back. */
    @Transactional(readOnly = true)
    public List<TheatreResponse> pending() {
        return theatreRepository.findByApprovedFalseAndRejectedAtIsNull()
                .stream().map(TheatreResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TheatreResponse> all() {
        return theatreRepository.findAll().stream().map(TheatreResponse::from).toList();
    }

    Theatre findEntity(Long id) {
        return theatreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Theatre not found: " + id));
    }

    @Transactional
    public TheatreResponse approve(Long id) {
        Theatre theatre = findEntity(id);
        theatre.setApproved(true);
        // Approving a previously rejected registration clears the rejection
        // outright, so the cleanup job never picks it up afterwards.
        theatre.setRejectedAt(null);
        theatre.setRejectionSeenAt(null);
        theatre.setRejectionReason(null);
        return TheatreResponse.from(theatreRepository.save(theatre));
    }

    /**
     * Marks a registration rejected rather than deleting it on the spot. The
     * owner is shown the reason on their next visit, and
     * {@code RejectedTheatreCleanupJob} purges it shortly after they have.
     */
    @Transactional
    public TheatreResponse reject(Long id, String reason) {
        Theatre theatre = findEntity(id);
        if (theatre.isApproved()) {
            throw new BadRequestException(
                    "This theatre is already approved - delete it instead if it should be removed");
        }
        theatre.setRejectedAt(LocalDateTime.now());
        theatre.setRejectionSeenAt(null);
        theatre.setRejectionReason(reason);
        return TheatreResponse.from(theatreRepository.save(theatre));
    }

}

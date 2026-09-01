package com.movieticket.app.service;

import com.movieticket.app.dto.screen.RowConfig;
import com.movieticket.app.dto.screen.ScreenRequest;
import com.movieticket.app.dto.screen.ScreenResponse;
import com.movieticket.app.dto.screen.ScreenUpdateRequest;
import com.movieticket.app.entity.BookingSeat;
import com.movieticket.app.entity.Screen;
import com.movieticket.app.entity.Seat;
import com.movieticket.app.entity.Theatre;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.exception.ResourceNotFoundException;
import com.movieticket.app.repository.BookingSeatRepository;
import com.movieticket.app.repository.ScreenRepository;
import com.movieticket.app.repository.SeatLockRepository;
import com.movieticket.app.repository.SeatRepository;
import com.movieticket.app.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScreenService {

    private final ScreenRepository screenRepository;
    private final SeatRepository seatRepository;
    private final SeatLockRepository seatLockRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final TheatreService theatreService;
    private final CurrentUser currentUser;

    @Transactional
    public ScreenResponse create(ScreenRequest request) {
        Theatre theatre = theatreService.findEntity(request.theatreId());
        requireOwner(theatre);

        Screen screen = screenRepository.save(Screen.builder()
                .name(request.name())
                .theatre(theatre)
                .build());

        List<Seat> seats = new ArrayList<>();
        for (RowConfig row : request.rows()) {
            for (int seatNumber = 1; seatNumber <= row.seatCount(); seatNumber++) {
                seats.add(Seat.builder()
                        .screen(screen)
                        .rowLabel(row.rowLabel())
                        .seatNumber(seatNumber)
                        .seatType(row.seatType())
                        .build());
            }
        }
        seats = seatRepository.saveAll(seats);

        return ScreenResponse.from(screen, seats);
    }

    /**
     * Applies a screen's desired name and layout.
     *
     * <p>Reconciles rather than rebuilds: rows that stay keep their existing
     * Seat rows (and therefore their ids), so tickets and locks pointing at
     * them survive. Only genuinely surplus seats are removed - and only if
     * nobody has bought them. Retiering a seat is always safe because
     * {@code BookingSeat} snapshots the price that was actually paid.
     */
    @Transactional
    public ScreenResponse update(Long id, ScreenUpdateRequest request) {
        Screen screen = findEntity(id);
        requireOwner(screen.getTheatre());

        List<RowConfig> desired = request.rows();
        Set<String> labels = new LinkedHashSet<>();
        for (RowConfig row : desired) {
            if (!labels.add(row.rowLabel().trim().toUpperCase())) {
                throw new BadRequestException("Row \"" + row.rowLabel() + "\" is listed twice");
            }
        }

        Map<String, List<Seat>> existingByRow = seatsFor(screen).stream()
                .collect(Collectors.groupingBy(seat -> seat.getRowLabel().toUpperCase(),
                        LinkedHashMap::new, Collectors.toList()));

        Map<String, RowConfig> desiredByRow = new LinkedHashMap<>();
        for (RowConfig row : desired) {
            desiredByRow.put(row.rowLabel().trim().toUpperCase(), row);
        }

        // ---- work out what would disappear ----
        List<Seat> doomed = new ArrayList<>();
        existingByRow.forEach((label, seats) -> {
            RowConfig keep = desiredByRow.get(label);
            if (keep == null) {
                doomed.addAll(seats);
            } else {
                seats.stream().filter(seat -> seat.getSeatNumber() > keep.seatCount()).forEach(doomed::add);
            }
        });

        if (!doomed.isEmpty()) {
            requireNoSoldSeats(doomed);
            List<Long> doomedIds = doomed.stream().map(Seat::getId).toList();
            seatLockRepository.deleteBySeatIds(doomedIds);
            seatRepository.deleteByIdsInBulk(doomedIds);
        }

        // ---- retier what stays, add what's new ----
        List<Seat> additions = new ArrayList<>();
        desiredByRow.forEach((label, row) -> {
            List<Seat> current = existingByRow.getOrDefault(label, List.of());
            for (Seat seat : current) {
                if (seat.getSeatNumber() <= row.seatCount() && seat.getSeatType() != row.seatType()) {
                    seat.setSeatType(row.seatType());
                    seatRepository.save(seat);
                }
            }
            int highest = current.stream().mapToInt(Seat::getSeatNumber).max().orElse(0);
            for (int number = highest + 1; number <= row.seatCount(); number++) {
                additions.add(Seat.builder()
                        .screen(screen)
                        .rowLabel(label)
                        .seatNumber(number)
                        .seatType(row.seatType())
                        .build());
            }
        });
        if (!additions.isEmpty()) {
            seatRepository.saveAll(additions);
        }

        screen.setName(request.name());
        screenRepository.save(screen);
        return ScreenResponse.from(screen, seatsFor(screen));
    }

    /**
     * Shrinking a row must never silently void a paid ticket. Deleting the
     * whole screen is the path that refunds; an edit refuses instead, naming
     * the seats so the owner knows exactly what is in the way.
     */
    private void requireNoSoldSeats(List<Seat> doomed) {
        List<BookingSeat> sold = bookingSeatRepository.findConfirmedForSeats(
                doomed.stream().map(Seat::getId).toList());
        if (sold.isEmpty()) return;

        String seatList = sold.stream()
                .map(bs -> bs.getSeat().getRowLabel() + bs.getSeat().getSeatNumber())
                .distinct()
                .sorted()
                .collect(Collectors.joining(", "));
        throw new BadRequestException(
                "Can't remove " + seatList + " - " + sold.size() + " confirmed ticket"
                        + (sold.size() == 1 ? " is" : "s are") + " already booked there. "
                        + "Keep those seats, or delete the screen instead (that refunds them).");
    }

    @Transactional(readOnly = true)
    public List<ScreenResponse> byTheatre(Long theatreId) {
        Theatre theatre = theatreService.findEntity(theatreId);
        return screenRepository.findByTheatre(theatre).stream()
                .map(screen -> ScreenResponse.from(screen, seatRepository.findByScreenOrderByRowLabelAscSeatNumberAsc(screen)))
                .toList();
    }

    Screen findEntity(Long id) {
        return screenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Screen not found: " + id));
    }

    List<Seat> seatsFor(Screen screen) {
        return seatRepository.findByScreenOrderByRowLabelAscSeatNumberAsc(screen);
    }

    void requireOwner(Theatre theatre) {
        if (!theatre.getOwner().getId().equals(currentUser.id())) {
            throw new AccessDeniedException("You do not own this theatre");
        }
    }
}

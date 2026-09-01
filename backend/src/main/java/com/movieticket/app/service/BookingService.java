package com.movieticket.app.service;

import com.movieticket.app.dto.booking.BookingResponse;
import com.movieticket.app.dto.booking.LockSeatsResponse;
import com.movieticket.app.dto.show.SeatMapEntry;
import com.movieticket.app.entity.*;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.exception.ConflictException;
import com.movieticket.app.exception.ResourceNotFoundException;
import com.movieticket.app.repository.*;
import com.movieticket.app.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final int LOCK_DURATION_MINUTES = 5;

    private final ShowRepository showRepository;
    private final SeatRepository seatRepository;
    private final SeatLockRepository seatLockRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final BookingRepository bookingRepository;
    private final MockPaymentService paymentService;
    private final CurrentUser currentUser;
    private final ScreenService screenService;

    @Transactional
    public List<SeatMapEntry> seatMap(Long showId) {
        Show show = getShow(showId);
        seatLockRepository.deleteExpired(LocalDateTime.now());

        List<Seat> seats = seatRepository.findByScreenOrderByRowLabelAscSeatNumberAsc(show.getScreen());
        Set<Long> bookedSeatIds = bookingSeatRepository.findByShowId(showId).stream()
                .map(bs -> bs.getSeat().getId()).collect(Collectors.toSet());
        List<Long> seatIds = seats.stream().map(Seat::getId).toList();
        Set<Long> lockedSeatIds = seatLockRepository.findByShowIdAndSeat_IdIn(showId, seatIds).stream()
                .map(l -> l.getSeat().getId()).collect(Collectors.toSet());

        return seats.stream().map(seat -> {
            BigDecimal price = show.getPrices().get(seat.getSeatType());
            String status = bookedSeatIds.contains(seat.getId()) ? "BOOKED"
                    : lockedSeatIds.contains(seat.getId()) ? "LOCKED"
                    : "AVAILABLE";
            return new SeatMapEntry(seat.getId(), seat.getRowLabel(), seat.getSeatNumber(), seat.getSeatType(), price, status);
        }).toList();
    }

    @Transactional
    public LockSeatsResponse lockSeats(Long showId, List<Long> seatIds) {
        Show show = getShow(showId);
        User user = currentUser.entity();
        LocalDateTime now = LocalDateTime.now();

        // A screening stops selling the moment it starts. The expiry job flips
        // the status within the minute; the clock covers the gap before it runs.
        if (show.getStatus() != ShowStatus.SCHEDULED || show.getShowDateTime().isBefore(now)) {
            throw new BadRequestException(
                    "This screening is no longer open for booking - please pick another showtime");
        }

        List<Seat> seats = validateSeatsBelongToShow(show, seatIds);

        seatLockRepository.deleteExpired(now);

        List<SeatLock> existingActiveLocks = seatLockRepository.findByShowIdAndSeat_IdIn(showId, seatIds);
        for (SeatLock lock : existingActiveLocks) {
            if (!lock.getLockedBy().getId().equals(user.getId())) {
                throw new ConflictException("Seat " + lock.getSeat().getRowLabel() + lock.getSeat().getSeatNumber()
                        + " is currently held by another user - try again shortly");
            }
        }

        Set<Long> bookedSeatIds = bookingSeatRepository.findByShowId(showId).stream()
                .map(bs -> bs.getSeat().getId()).collect(Collectors.toSet());
        for (Seat seat : seats) {
            if (bookedSeatIds.contains(seat.getId())) {
                throw new ConflictException("Seat " + seat.getRowLabel() + seat.getSeatNumber() + " is already booked");
            }
        }

        Set<Long> alreadyLockedByMe = existingActiveLocks.stream().map(l -> l.getSeat().getId()).collect(Collectors.toSet());
        LocalDateTime expiresAt = now.plusMinutes(LOCK_DURATION_MINUTES);

        for (SeatLock lock : existingActiveLocks) {
            lock.setExpiresAt(expiresAt);
        }
        seatLockRepository.saveAll(existingActiveLocks);

        List<SeatLock> newLocks = new ArrayList<>();
        for (Seat seat : seats) {
            if (!alreadyLockedByMe.contains(seat.getId())) {
                newLocks.add(SeatLock.builder()
                        .showId(showId)
                        .seat(seat)
                        .lockedBy(user)
                        .expiresAt(expiresAt)
                        .build());
            }
        }
        try {
            seatLockRepository.saveAll(newLocks);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("One or more selected seats were just taken - please reselect");
        }

        return new LockSeatsResponse(seatIds, expiresAt);
    }

    @Transactional
    public BookingResponse confirmBooking(Long showId, List<Long> seatIds) {
        Show show = getShow(showId);
        User user = currentUser.entity();
        LocalDateTime now = LocalDateTime.now();

        List<Seat> seats = validateSeatsBelongToShow(show, seatIds);

        List<SeatLock> myLocks = seatLockRepository.findByShowIdAndLockedBy_IdAndSeat_IdIn(showId, user.getId(), seatIds);
        Set<Long> myLockedSeatIds = myLocks.stream()
                .filter(l -> l.getExpiresAt().isAfter(now))
                .map(l -> l.getSeat().getId())
                .collect(Collectors.toSet());
        if (!myLockedSeatIds.containsAll(seatIds)) {
            throw new BadRequestException("Your hold on one or more seats has expired - please reselect your seats");
        }

        BigDecimal total = BigDecimal.ZERO;
        for (Seat seat : seats) {
            BigDecimal price = show.getPrices().get(seat.getSeatType());
            if (price == null) {
                throw new BadRequestException("No price configured for seat type " + seat.getSeatType());
            }
            total = total.add(price);
        }

        paymentService.charge(total, "Booking for show " + showId);

        Booking booking = Booking.builder()
                .user(user)
                .show(show)
                .bookingTime(now)
                .status(BookingStatus.CONFIRMED)
                .totalAmount(total)
                .build();

        List<BookingSeat> bookingSeats = new ArrayList<>();
        for (Seat seat : seats) {
            bookingSeats.add(BookingSeat.builder()
                    .booking(booking)
                    .showId(showId)
                    .seat(seat)
                    .price(show.getPrices().get(seat.getSeatType()))
                    .build());
        }
        booking.setSeats(bookingSeats);

        try {
            booking = bookingRepository.save(booking);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("One or more seats were just booked by someone else - please reselect");
        }

        seatLockRepository.deleteAll(myLocks);

        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings() {
        return bookingRepository.findByUserOrderByBookingTimeDesc(currentUser.entity()).stream()
                .map(BookingResponse::from).toList();
    }

    @Transactional
    public BookingResponse cancel(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        if (!booking.getUser().getId().equals(currentUser.id())) {
            throw new AccessDeniedException("This booking does not belong to you");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }

        booking.getSeats().clear();
        booking.setStatus(BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);

        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> bookingsForShow(Long showId) {
        Show show = getShow(showId);
        screenService.requireOwner(show.getScreen().getTheatre());
        return bookingRepository.findByShow(show).stream().map(BookingResponse::from).toList();
    }

    private Show getShow(Long showId) {
        return showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found: " + showId));
    }

    private List<Seat> validateSeatsBelongToShow(Show show, List<Long> seatIds) {
        List<Seat> seats = seatRepository.findAllById(seatIds);
        if (seats.size() != seatIds.size()) {
            throw new BadRequestException("One or more seat ids are invalid");
        }
        for (Seat seat : seats) {
            if (!seat.getScreen().getId().equals(show.getScreen().getId())) {
                throw new BadRequestException("Seat " + seat.getId() + " does not belong to this show's screen");
            }
        }
        return seats;
    }
}

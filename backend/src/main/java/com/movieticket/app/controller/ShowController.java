package com.movieticket.app.controller;

import com.movieticket.app.dto.booking.LockSeatsRequest;
import com.movieticket.app.dto.booking.LockSeatsResponse;
import com.movieticket.app.dto.show.SeatMapEntry;
import com.movieticket.app.dto.show.ShowResponse;
import com.movieticket.app.service.BookingService;
import com.movieticket.app.service.ShowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shows")
@RequiredArgsConstructor
public class ShowController {

    private final ShowService showService;
    private final BookingService bookingService;

    @GetMapping("/{id}")
    public ShowResponse get(@PathVariable Long id) {
        return showService.get(id);
    }

    @GetMapping("/{id}/seats")
    public List<SeatMapEntry> seatMap(@PathVariable Long id) {
        return bookingService.seatMap(id);
    }

    @PostMapping("/{id}/seats/lock")
    public LockSeatsResponse lockSeats(@PathVariable Long id, @Valid @RequestBody LockSeatsRequest request) {
        return bookingService.lockSeats(id, request.seatIds());
    }
}

package com.movieticket.app.controller;

import com.movieticket.app.dto.booking.BookingResponse;
import com.movieticket.app.dto.show.RecurringShowPlanResponse;
import com.movieticket.app.dto.show.RecurringShowRequest;
import com.movieticket.app.dto.show.ShowRequest;
import com.movieticket.app.dto.show.ShowResponse;
import com.movieticket.app.service.BookingService;
import com.movieticket.app.service.RecurringShowService;
import com.movieticket.app.service.ShowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/shows")
@RequiredArgsConstructor
public class OwnerShowController {

    private final ShowService showService;
    private final RecurringShowService recurringShowService;
    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ShowResponse> create(@Valid @RequestBody ShowRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(showService.create(request));
    }

    /**
     * Dry run: works out every screening a recurring plan would create and which
     * slots are blocked, without writing anything.
     */
    @PostMapping("/recurring/preview")
    public RecurringShowPlanResponse previewRecurring(@Valid @RequestBody RecurringShowRequest request) {
        return recurringShowService.preview(request);
    }

    /** Commits a recurring plan, creating every free slot as one series. */
    @PostMapping("/recurring")
    public ResponseEntity<RecurringShowPlanResponse> createRecurring(@Valid @RequestBody RecurringShowRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recurringShowService.create(request));
    }

    @GetMapping
    public List<ShowResponse> mine() {
        return showService.myShows();
    }

    @GetMapping("/{id}/bookings")
    public List<BookingResponse> bookings(@PathVariable Long id) {
        return bookingService.bookingsForShow(id);
    }
}

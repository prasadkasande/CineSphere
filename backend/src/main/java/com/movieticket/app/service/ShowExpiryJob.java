package com.movieticket.app.service;

import com.movieticket.app.repository.ShowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Retires shows once their start time has passed. The row is kept - bookings,
 * revenue stats and the customer's ticket all still point at it - it just stops
 * being SCHEDULED, so nothing can be booked against a screening that has begun.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ShowExpiryJob {

    private final ShowRepository showRepository;

    // The delay lets startup finish - including the shows.status column patch -
    // before the first sweep touches the table.
    @Scheduled(fixedRate = 60_000, initialDelay = 20_000)
    @Transactional
    public void completePastShows() {
        int completed = showRepository.markPastShowsCompleted(LocalDateTime.now());
        if (completed > 0) {
            log.info("Marked {} past show(s) COMPLETED", completed);
        }
    }
}

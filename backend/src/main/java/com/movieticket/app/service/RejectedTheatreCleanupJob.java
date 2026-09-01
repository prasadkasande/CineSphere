package com.movieticket.app.service;

import com.movieticket.app.entity.Theatre;
import com.movieticket.app.repository.TheatreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Removes rejected theatre registrations once the owner has had a chance to
 * read why - the same contract {@link RejectedAccountCleanupJob} applies to
 * business accounts, and for the same reason: the clock starts when the owner
 * first sees the message (their next visit to the Theatres tab), not when the
 * admin rejected it, so the explanation is never missed.
 *
 * <p>Purges through {@link CascadeDeletionSupport} because an owner can add
 * screens to a theatre while it is still awaiting approval.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RejectedTheatreCleanupJob {

    private static final Duration AFTER_SEEN = Duration.ofMinutes(5);
    private static final Duration UNSEEN_BACKSTOP = Duration.ofDays(30);

    private final TheatreRepository theatreRepository;
    private final CascadeDeletionSupport cascade;

    @Scheduled(fixedRate = 60_000, initialDelay = 20_000)
    @Transactional
    public void purgeRejectedTheatres() {
        LocalDateTime now = LocalDateTime.now();

        List<Theatre> due = theatreRepository.findByRejectedAtNotNull().stream()
                .filter(t -> {
                    if (t.getRejectionSeenAt() != null) {
                        return t.getRejectionSeenAt().plus(AFTER_SEEN).isBefore(now);
                    }
                    return t.getRejectedAt().plus(UNSEEN_BACKSTOP).isBefore(now);
                })
                .toList();

        if (due.isEmpty()) {
            return;
        }

        // A pending theatre can't have bookings (shows need an approved
        // theatre), so there is nothing to refund - just clear the chain.
        due.forEach(cascade::purgeTheatre);
        log.info("Purged {} rejected theatre registration(s)", due.size());
    }
}

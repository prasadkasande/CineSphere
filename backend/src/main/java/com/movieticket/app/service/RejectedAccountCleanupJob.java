package com.movieticket.app.service;

import com.movieticket.app.entity.User;
import com.movieticket.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Removes rejected business registrations once the applicant has had a chance
 * to read why. The clock starts when they first see the message (their next
 * login attempt), not when the admin rejected it - otherwise someone who
 * doesn't check for an hour would never learn the reason.
 *
 * Unseen rejections are kept until a much longer backstop expires, so the
 * message is never lost.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RejectedAccountCleanupJob {

    private static final Duration AFTER_SEEN = Duration.ofMinutes(5);
    private static final Duration UNSEEN_BACKSTOP = Duration.ofDays(30);

    private final UserRepository userRepository;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void purgeRejectedAccounts() {
        LocalDateTime now = LocalDateTime.now();

        List<User> due = userRepository.findByRejectedAtNotNull().stream()
                .filter(u -> {
                    if (u.getRejectionSeenAt() != null) {
                        return u.getRejectionSeenAt().plus(AFTER_SEEN).isBefore(now);
                    }
                    return u.getRejectedAt().plus(UNSEEN_BACKSTOP).isBefore(now);
                })
                .toList();

        if (due.isEmpty()) {
            return;
        }

        userRepository.deleteAll(due);
        log.info("Purged {} rejected registration(s)", due.size());
    }
}

package com.movieticket.app.service;

import com.movieticket.app.repository.SeatLockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class SeatLockCleanupJob {

    private final SeatLockRepository seatLockRepository;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void purgeExpiredLocks() {
        seatLockRepository.deleteExpired(LocalDateTime.now());
    }
}

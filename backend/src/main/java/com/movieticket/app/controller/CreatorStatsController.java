package com.movieticket.app.controller;

import com.movieticket.app.dto.stats.CreatorStatsResponse;
import com.movieticket.app.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/creator")
@RequiredArgsConstructor
public class CreatorStatsController {

    private final StatsService statsService;

    @GetMapping("/stats")
    public CreatorStatsResponse stats() {
        return statsService.creatorStats();
    }
}

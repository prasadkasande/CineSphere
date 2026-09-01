package com.movieticket.app.controller;

import com.movieticket.app.dto.stats.AdminStatsResponse;
import com.movieticket.app.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminStatsController {

    private final StatsService statsService;

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return statsService.adminStats();
    }
}

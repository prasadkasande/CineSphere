package com.movieticket.app.controller;

import com.movieticket.app.dto.movie.MovieResponse;
import com.movieticket.app.dto.stats.OwnerStatsResponse;
import com.movieticket.app.service.MovieService;
import com.movieticket.app.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
public class OwnerDashboardController {

    private final StatsService statsService;
    private final MovieService movieService;

    @GetMapping("/stats")
    public OwnerStatsResponse stats() {
        return statsService.ownerStats();
    }

    /** Everything the owner may schedule - backs the "Schedule a show" dropdown. */
    @GetMapping("/movies")
    public List<MovieResponse> schedulableMovies() {
        return movieService.schedulable();
    }

    /** Movies the owner has never scheduled - programming gaps to fill. */
    @GetMapping("/movies/unfeatured")
    public List<MovieResponse> unfeaturedMovies() {
        return movieService.notFeaturedForCurrentOwner();
    }
}

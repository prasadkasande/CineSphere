package com.movieticket.app.controller;

import com.movieticket.app.dto.movie.MovieFiltersResponse;
import com.movieticket.app.dto.movie.MovieResponse;
import com.movieticket.app.dto.show.MovieShowtimesResponse;
import com.movieticket.app.entity.MovieStatus;
import com.movieticket.app.service.MovieService;
import com.movieticket.app.service.ShowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;
    private final ShowService showService;

    @GetMapping
    public List<MovieResponse> list(@RequestParam(required = false) MovieStatus status,
                                     @RequestParam(required = false) String search,
                                     @RequestParam(required = false) String genre,
                                     @RequestParam(required = false) String language,
                                     @RequestParam(required = false) String sort) {
        return movieService.search(status, search, genre, language, sort);
    }

    @GetMapping("/filters")
    public MovieFiltersResponse filters() {
        return movieService.filters();
    }

    /** Admin-curated hero rotation for the home page. */
    @GetMapping("/featured")
    public List<MovieResponse> featured() {
        return movieService.featured();
    }

    @GetMapping("/{id}")
    public MovieResponse get(@PathVariable Long id) {
        return movieService.get(id);
    }

    @GetMapping("/{id}/shows")
    public MovieShowtimesResponse shows(@PathVariable Long id,
                                        @RequestParam(required = false) String city,
                                        @RequestParam(required = false) Integer days) {
        return showService.forMovie(id, city, days);
    }
}

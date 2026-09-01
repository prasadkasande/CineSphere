package com.movieticket.app.controller;

import com.movieticket.app.dto.movie.MovieRequest;
import com.movieticket.app.dto.movie.MovieResponse;
import com.movieticket.app.service.MovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/creator/movies")
@RequiredArgsConstructor
public class CreatorMovieController {

    private final MovieService movieService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MovieResponse> create(@Valid @ModelAttribute MovieRequest request,
                                                 @RequestPart(value = "coverImage", required = false) MultipartFile coverImage) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movieService.createByCreator(request, coverImage));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MovieResponse update(@PathVariable Long id,
                                 @Valid @ModelAttribute MovieRequest request,
                                 @RequestPart(value = "coverImage", required = false) MultipartFile coverImage) {
        return movieService.updateByCreator(id, request, coverImage);
    }

    /** Puts a rejected title back in the admin queue after the note is addressed. */
    @PutMapping("/{id}/resubmit")
    public MovieResponse resubmit(@PathVariable Long id) {
        return movieService.resubmit(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        movieService.deleteByCreator(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<MovieResponse> mine() {
        return movieService.myMovies();
    }
}

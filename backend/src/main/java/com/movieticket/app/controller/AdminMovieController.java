package com.movieticket.app.controller;

import com.movieticket.app.dto.admin.AdminMovieResponse;
import com.movieticket.app.dto.admin.DeleteRequest;
import com.movieticket.app.dto.admin.DeletionImpactResponse;
import com.movieticket.app.dto.admin.RejectRequest;
import com.movieticket.app.dto.movie.MovieResponse;
import com.movieticket.app.entity.ApprovalStatus;
import com.movieticket.app.service.AdminDeletionService;
import com.movieticket.app.service.MovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin does not author movies (Movie Creators do, via CreatorMovieController).
 * Admin curates: remove policy-violating titles, and choose which movies are
 * featured in the home page hero rotation.
 */
@RestController
@RequestMapping("/api/admin/movies")
@RequiredArgsConstructor
public class AdminMovieController {

    private final MovieService movieService;
    private final AdminDeletionService adminDeletionService;

    /** Full catalogue, including titles no theatre has scheduled yet. */
    @GetMapping
    public List<AdminMovieResponse> all() {
        return movieService.listAllForAdmin();
    }

    /** Creator submissions awaiting review. */
    @GetMapping("/pending")
    public List<MovieResponse> pending() {
        return movieService.pendingApproval();
    }

    @PutMapping("/{id}/approve")
    public MovieResponse approve(@PathVariable Long id) {
        return movieService.review(id, ApprovalStatus.APPROVED, null);
    }

    /** The reason is mandatory - the creator is shown it verbatim. */
    @PutMapping("/{id}/reject")
    public MovieResponse reject(@PathVariable Long id, @Valid @RequestBody RejectRequest request) {
        return movieService.review(id, ApprovalStatus.REJECTED, request.reason());
    }

    @PutMapping("/{id}/archive")
    public MovieResponse archive(@PathVariable Long id) {
        return movieService.archive(id);
    }

    @GetMapping("/{id}/deletion-impact")
    public DeletionImpactResponse deletionImpact(@PathVariable Long id) {
        return adminDeletionService.movieImpact(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestBody(required = false) DeleteRequest request) {
        adminDeletionService.deleteMovie(id, request == null ? null : request.note());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/feature")
    public MovieResponse feature(@PathVariable Long id) {
        return movieService.setFeatured(id, true);
    }

    @PutMapping("/{id}/unfeature")
    public MovieResponse unfeature(@PathVariable Long id) {
        return movieService.setFeatured(id, false);
    }
}

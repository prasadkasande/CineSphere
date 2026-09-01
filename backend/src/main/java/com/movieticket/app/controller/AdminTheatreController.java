package com.movieticket.app.controller;

import com.movieticket.app.dto.admin.DeleteRequest;
import com.movieticket.app.dto.admin.DeletionImpactResponse;
import com.movieticket.app.dto.admin.RejectRequest;
import com.movieticket.app.dto.theatre.TheatreResponse;
import com.movieticket.app.service.AdminDeletionService;
import com.movieticket.app.service.TheatreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/theatres")
@RequiredArgsConstructor
public class AdminTheatreController {

    private final TheatreService theatreService;
    private final AdminDeletionService adminDeletionService;

    @GetMapping
    public List<TheatreResponse> all() {
        return theatreService.all();
    }

    @GetMapping("/pending")
    public List<TheatreResponse> pending() {
        return theatreService.pending();
    }

    @PostMapping("/{id}/approve")
    public TheatreResponse approve(@PathVariable Long id) {
        return theatreService.approve(id);
    }

    /**
     * Rejecting does not delete on the spot - the owner is shown the reason
     * first, then the registration is purged automatically.
     */
    @PostMapping("/{id}/reject")
    public TheatreResponse reject(@PathVariable Long id, @Valid @RequestBody RejectRequest request) {
        return theatreService.reject(id, request.reason());
    }

    @GetMapping("/{id}/deletion-impact")
    public DeletionImpactResponse deletionImpact(@PathVariable Long id) {
        return adminDeletionService.theatreImpact(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestBody(required = false) DeleteRequest request) {
        adminDeletionService.deleteTheatre(id, request == null ? null : request.note());
        return ResponseEntity.noContent().build();
    }
}

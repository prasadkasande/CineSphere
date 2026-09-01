package com.movieticket.app.controller;

import com.movieticket.app.dto.admin.DeleteRequest;
import com.movieticket.app.dto.admin.DeletionImpactResponse;
import com.movieticket.app.dto.screen.ScreenRequest;
import com.movieticket.app.dto.screen.ScreenResponse;
import com.movieticket.app.dto.screen.ScreenUpdateRequest;
import com.movieticket.app.service.OwnerDeletionService;
import com.movieticket.app.service.ScreenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/screens")
@RequiredArgsConstructor
public class OwnerScreenController {

    private final ScreenService screenService;
    private final OwnerDeletionService ownerDeletionService;

    @PostMapping
    public ResponseEntity<ScreenResponse> create(@Valid @RequestBody ScreenRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(screenService.create(request));
    }

    @GetMapping
    public List<ScreenResponse> byTheatre(@RequestParam Long theatreId) {
        return screenService.byTheatre(theatreId);
    }

    /** Name and full row layout; surplus seats are removed only if unsold. */
    @PutMapping("/{id}")
    public ScreenResponse update(@PathVariable Long id, @Valid @RequestBody ScreenUpdateRequest request) {
        return screenService.update(id, request);
    }

    @GetMapping("/{id}/deletion-impact")
    public DeletionImpactResponse deletionImpact(@PathVariable Long id) {
        return ownerDeletionService.screenImpact(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestBody(required = false) DeleteRequest request) {
        ownerDeletionService.deleteScreen(id, request == null ? null : request.note());
        return ResponseEntity.noContent().build();
    }
}

package com.movieticket.app.controller;

import com.movieticket.app.dto.admin.DeleteRequest;
import com.movieticket.app.dto.admin.DeletionImpactResponse;
import com.movieticket.app.dto.theatre.TheatreRequest;
import com.movieticket.app.dto.theatre.TheatreResponse;
import com.movieticket.app.service.OwnerDeletionService;
import com.movieticket.app.service.TheatreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/theatres")
@RequiredArgsConstructor
public class OwnerTheatreController {

    private final TheatreService theatreService;
    private final OwnerDeletionService ownerDeletionService;

    @PostMapping
    public ResponseEntity<TheatreResponse> create(@Valid @RequestBody TheatreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(theatreService.create(request));
    }

    @GetMapping
    public List<TheatreResponse> mine() {
        return theatreService.myTheatres();
    }

    @PutMapping("/{id}")
    public TheatreResponse update(@PathVariable Long id, @Valid @RequestBody TheatreRequest request) {
        return theatreService.update(id, request);
    }

    /**
     * Files a corrected application in place of a rejected one. The old
     * registration is removed as part of the same call.
     */
    @PostMapping("/{id}/resubmit")
    public TheatreResponse resubmit(@PathVariable Long id, @Valid @RequestBody TheatreRequest request) {
        return theatreService.resubmit(id, request);
    }

    @GetMapping("/{id}/deletion-impact")
    public DeletionImpactResponse deletionImpact(@PathVariable Long id) {
        return ownerDeletionService.theatreImpact(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestBody(required = false) DeleteRequest request) {
        ownerDeletionService.deleteTheatre(id, request == null ? null : request.note());
        return ResponseEntity.noContent().build();
    }
}

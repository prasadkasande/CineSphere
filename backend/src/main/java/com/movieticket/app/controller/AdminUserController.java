package com.movieticket.app.controller;

import com.movieticket.app.dto.admin.DeleteRequest;
import com.movieticket.app.dto.admin.DeletionImpactResponse;
import com.movieticket.app.dto.admin.RejectRequest;
import com.movieticket.app.dto.admin.UserResponse;
import jakarta.validation.Valid;
import com.movieticket.app.service.AdminDeletionService;
import com.movieticket.app.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final AdminDeletionService adminDeletionService;

    @GetMapping
    public List<UserResponse> list() {
        return adminUserService.list();
    }

    @GetMapping("/pending")
    public List<UserResponse> pending() {
        return adminUserService.pending();
    }

    @PostMapping("/{id}/approve")
    public UserResponse approve(@PathVariable Long id) {
        return adminUserService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public UserResponse reject(@PathVariable Long id, @Valid @RequestBody RejectRequest request) {
        return adminUserService.reject(id, request.reason());
    }

    @GetMapping("/{id}/deletion-impact")
    public DeletionImpactResponse deletionImpact(@PathVariable Long id) {
        return adminDeletionService.userImpact(id);
    }

    @PutMapping("/{id}/suspend")
    public UserResponse suspend(@PathVariable Long id) {
        return adminUserService.setEnabled(id, false);
    }

    @PutMapping("/{id}/activate")
    public UserResponse activate(@PathVariable Long id) {
        return adminUserService.setEnabled(id, true);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestBody(required = false) DeleteRequest request) {
        adminDeletionService.deleteUser(id, request == null ? null : request.note());
        return ResponseEntity.noContent().build();
    }
}

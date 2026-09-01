package com.movieticket.app.dto.admin;

import com.movieticket.app.entity.Role;
import com.movieticket.app.entity.User;

public record UserResponse(
        Long id,
        String name,
        String email,
        String phone,
        Role role,
        boolean enabled,
        boolean approved,
        boolean rejected,
        String rejectionReason
) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole(),
                u.isEnabled(), u.isApproved(), u.isRejected(), u.getRejectionReason());
    }
}

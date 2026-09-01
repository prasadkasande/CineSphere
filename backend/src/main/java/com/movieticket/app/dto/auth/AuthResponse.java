package com.movieticket.app.dto.auth;

import com.movieticket.app.entity.Role;

public record AuthResponse(
        String token,
        Long userId,
        String name,
        String email,
        Role role
) {
}

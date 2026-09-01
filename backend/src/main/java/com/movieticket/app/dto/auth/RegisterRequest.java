package com.movieticket.app.dto.auth;

import com.movieticket.app.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, message = "password must be at least 6 characters") String password,
        String phone,
        @NotNull Role role
) {
}

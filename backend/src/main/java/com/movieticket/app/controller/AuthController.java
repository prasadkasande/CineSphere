package com.movieticket.app.controller;

import com.movieticket.app.dto.auth.AuthResponse;
import com.movieticket.app.dto.auth.BusinessRegistrationResponse;
import com.movieticket.app.dto.auth.LoginRequest;
import com.movieticket.app.dto.auth.RegisterRequest;
import com.movieticket.app.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/register-business")
    public ResponseEntity<BusinessRegistrationResponse> registerBusiness(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerBusiness(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}

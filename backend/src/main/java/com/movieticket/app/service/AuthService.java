package com.movieticket.app.service;

import com.movieticket.app.dto.auth.AuthResponse;
import com.movieticket.app.dto.auth.BusinessRegistrationResponse;
import com.movieticket.app.dto.auth.LoginRequest;
import com.movieticket.app.dto.auth.RegisterRequest;
import com.movieticket.app.entity.Role;
import com.movieticket.app.entity.User;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.exception.ConflictException;
import com.movieticket.app.repository.UserRepository;
import com.movieticket.app.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<Role> BUSINESS_ROLES = Set.of(Role.THEATRE_OWNER, Role.MOVIE_CREATOR);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.role() != Role.CUSTOMER) {
            throw new BadRequestException(
                    "Only moviegoer accounts can self-register here - use the CineSphere Business page for Theatre Owner or Movie Creator accounts");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .role(request.role())
                .enabled(true)
                .approved(true)
                .build();
        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public BusinessRegistrationResponse registerBusiness(RegisterRequest request) {
        if (!BUSINESS_ROLES.contains(request.role())) {
            throw new BadRequestException("Business accounts must be Theatre Owner or Movie Creator");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .role(request.role())
                .enabled(true)
                .approved(false)
                .build();
        userRepository.save(user);

        return new BusinessRegistrationResponse(
                "Thanks! Your application has been submitted for review. You'll be able to log in once an admin approves it.",
                user.getEmail()
        );
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (DisabledException ex) {
            User user = userRepository.findByEmail(request.email()).orElse(null);
            if (user != null && user.isRejected()) {
                throw new BadRequestException(rejectionMessage(user));
            }
            if (user != null && !user.isApproved()) {
                throw new BadRequestException(
                        "Your business account is still pending admin approval - you'll be notified once it's reviewed.");
            }
            throw new BadRequestException("Your account has been suspended. Contact support for help.");
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        return buildAuthResponse(user);
    }

    /**
     * Delivers the admin's reason to the applicant and starts the removal
     * clock on first read, so the account is cleaned up shortly after they've
     * had a chance to see it.
     */
    private String rejectionMessage(User user) {
        if (user.getRejectionSeenAt() == null) {
            // save() carries its own transaction - a self-invoked @Transactional
            // here would be bypassed by the proxy and silently do nothing.
            user.setRejectionSeenAt(LocalDateTime.now());
            userRepository.save(user);
        }
        return "Your application was not approved. Reason: " + user.getRejectionReason()
                + " — this registration will be removed shortly, and you're welcome to apply again afterwards.";
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getEmail(), Map.of(
                "role", user.getRole().name(),
                "userId", user.getId()
        ));
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}

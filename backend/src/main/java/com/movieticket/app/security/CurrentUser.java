package com.movieticket.app.security;

import com.movieticket.app.entity.User;
import com.movieticket.app.exception.ResourceNotFoundException;
import com.movieticket.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepository userRepository;

    public UserPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new IllegalStateException("No authenticated user in context");
        }
        return principal;
    }

    public Long id() {
        return principal().getId();
    }

    public User entity() {
        return userRepository.findById(id())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }
}

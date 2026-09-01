package com.movieticket.app.service;

import com.movieticket.app.dto.admin.UserResponse;
import com.movieticket.app.entity.Role;
import com.movieticket.app.entity.User;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.exception.ResourceNotFoundException;
import com.movieticket.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    public List<UserResponse> list() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    /** Applications still awaiting a decision - rejected ones drop out. */
    public List<UserResponse> pending() {
        return userRepository.findByApprovedFalse().stream()
                .filter(u -> !u.isRejected())
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse approve(Long userId) {
        User user = findPendingBusinessUser(userId);
        user.setApproved(true);
        return UserResponse.from(userRepository.save(user));
    }

    /**
     * Rejection keeps the account alive briefly so the applicant can read why.
     * A scheduled sweep removes it once they've seen the message.
     */
    @Transactional
    public UserResponse reject(Long userId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("A rejection reason is required - the applicant is shown this message");
        }
        User user = findPendingBusinessUser(userId);
        user.setRejectionReason(reason.trim());
        user.setRejectedAt(LocalDateTime.now());
        user.setRejectionSeenAt(null);
        return UserResponse.from(userRepository.save(user));
    }

    private User findPendingBusinessUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (user.isApproved() || user.isRejected()) {
            throw new BadRequestException("This account has already been reviewed");
        }
        return user;
    }

    @Transactional
    public UserResponse setEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot suspend an admin account");
        }
        user.setEnabled(enabled);
        return UserResponse.from(userRepository.save(user));
    }
}

package com.movieticket.app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private Role role;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    /**
     * Theatre Owner / Movie Creator accounts start unapproved after
     * self-registering via the business page and can't log in until an
     * admin approves them. Customers (and seeded accounts) default to
     * approved. Independent of `enabled`, which is for post-approval
     * suspension.
     */
    @Builder.Default
    @Column(nullable = false)
    private boolean approved = true;

    /**
     * Rejection is a short-lived state, not a delete: the applicant gets one
     * chance to read why. Set when an admin rejects; the account is purged
     * automatically once the applicant has seen the message.
     */
    @Column(length = 500)
    private String rejectionReason;

    private LocalDateTime rejectedAt;

    /** Stamped the first time the applicant is shown the reason. */
    private LocalDateTime rejectionSeenAt;

    public boolean isRejected() {
        return rejectedAt != null;
    }
}

package com.movieticket.app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "theatres")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Theatre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    private String address;

    private String phone;

    private String pincode;

    @Column(length = 300)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Builder.Default
    @Column(nullable = false)
    private boolean approved = false;

    /**
     * Rejection is a short-lived state, not an immediate delete - the owner
     * gets one chance to read why, exactly as a rejected business account does.
     * The theatre is purged once they have seen the message.
     */
    @Column(length = 500)
    private String rejectionReason;

    private LocalDateTime rejectedAt;

    /** Stamped the first time the owner is shown the reason. */
    private LocalDateTime rejectionSeenAt;

    public boolean isRejected() {
        return rejectedAt != null;
    }
}

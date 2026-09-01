package com.movieticket.app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Durable record of a refunded ticket.
 *
 * Deliberately holds *snapshots* (title, seats, showtime) rather than foreign
 * keys: the movie, show and booking it refers to are usually deleted moments
 * later, and the customer still needs to see what they were refunded for.
 * Only the customer FK is real, so refunds can be listed per account.
 */
@Entity
@Table(name = "refunds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** Kept so a refund is still traceable if the account itself is removed. */
    @Column(nullable = false)
    private String customerEmail;

    @Column(nullable = false)
    private String movieTitle;

    private String theatreName;

    private LocalDateTime showDateTime;

    /** e.g. "A1, A2" - the booking rows are gone by the time this is read. */
    private String seats;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30)")
    private RefundReason reason;

    /** Free-text note from the admin explaining the removal. */
    @Column(length = 500)
    private String note;

    @Column(nullable = false)
    private String paymentReference;

    @Column(nullable = false)
    private LocalDateTime refundedAt;
}

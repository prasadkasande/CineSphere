package com.movieticket.app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    private String genre;

    private String language;

    private Integer durationMins;

    private String coverImageUrl;

    private String censorRating;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private MovieStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    /**
     * Creator submissions start PENDING and only become visible to the public
     * and to theatre owners once an admin approves them. The column default
     * keeps pre-existing rows live through a ddl-auto=update migration.
     */
    /**
     * Why an admin rejected this title. Shown verbatim to the creator so a
     * rejection is actionable instead of a dead end; cleared when they resubmit.
     */
    @Column(length = 500)
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'APPROVED'")
    private ApprovalStatus approvalStatus = ApprovalStatus.APPROVED;

    /**
     * Admin-curated: featured titles rotate through the home page hero.
     * The column default lets ddl-auto=update backfill existing rows instead
     * of failing on the not-null constraint.
     */
    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean featured = false;

    /** Lower numbers appear earlier in the hero rotation. */
    @Builder.Default
    @Column(nullable = false, columnDefinition = "integer default 0")
    private int featuredOrder = 0;
}

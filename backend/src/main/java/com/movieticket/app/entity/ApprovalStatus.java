package com.movieticket.app.entity;

/**
 * Review state of a creator-submitted movie. Only APPROVED titles are visible
 * to the public and schedulable by theatre owners.
 */
public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}

package com.movieticket.app.entity;

public enum RefundReason {
    MOVIE_REMOVED,
    THEATRE_REMOVED,
    /** A single screen was removed - the theatre itself keeps running. */
    SCREEN_REMOVED,
    ACCOUNT_REMOVED
}

package com.movieticket.app.entity;

public enum ShowStatus {
    SCHEDULED,
    /** Its start time has passed - kept for booking history, never bookable again. */
    COMPLETED,
    CANCELLED
}

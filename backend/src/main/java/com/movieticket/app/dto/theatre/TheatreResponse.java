package com.movieticket.app.dto.theatre;

import com.movieticket.app.entity.Theatre;

public record TheatreResponse(
        Long id,
        String name,
        String city,
        String address,
        String phone,
        String pincode,
        String description,
        Long ownerId,
        String ownerName,
        boolean approved,
        boolean rejected,
        /** Non-null only while the theatre sits rejected - shown to its owner. */
        String rejectionReason
) {
    public static TheatreResponse from(Theatre t) {
        return new TheatreResponse(t.getId(), t.getName(), t.getCity(), t.getAddress(),
                t.getPhone(), t.getPincode(), t.getDescription(),
                t.getOwner().getId(), t.getOwner().getName(), t.isApproved(),
                t.isRejected(), t.getRejectionReason());
    }
}

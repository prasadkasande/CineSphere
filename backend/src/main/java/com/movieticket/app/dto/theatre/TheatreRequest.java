package com.movieticket.app.dto.theatre;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TheatreRequest(
        @NotBlank String name,
        @NotBlank String city,
        @NotBlank String address,
        @Size(max = 20) String phone,
        @Size(max = 12) String pincode,
        @Size(max = 300) String description
) {
}

package com.movieticket.app.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Reason shown to the applicant when their registration is turned down. */
public record RejectRequest(
        @NotBlank(message = "a reason is required - the applicant is shown this message")
        @Size(max = 500) String reason
) {
}

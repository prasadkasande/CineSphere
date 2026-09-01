package com.movieticket.app.dto.admin;

import jakarta.validation.constraints.Size;

/** Optional note recorded against any refunds the deletion triggers. */
public record DeleteRequest(
        @Size(max = 500) String note
) {
}

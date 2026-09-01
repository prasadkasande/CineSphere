package com.movieticket.app.dto.movie;

import java.util.List;

public record MovieFiltersResponse(
        List<String> genres,
        List<String> languages
) {
}

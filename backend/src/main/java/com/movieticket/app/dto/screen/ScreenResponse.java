package com.movieticket.app.dto.screen;

import com.movieticket.app.entity.Screen;
import com.movieticket.app.entity.Seat;

import java.util.List;

public record ScreenResponse(
        Long id,
        String name,
        Long theatreId,
        List<SeatResponse> seats
) {
    public static ScreenResponse from(Screen screen, List<Seat> seats) {
        return new ScreenResponse(
                screen.getId(),
                screen.getName(),
                screen.getTheatre().getId(),
                seats.stream().map(SeatResponse::from).toList()
        );
    }
}

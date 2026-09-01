package com.movieticket.app.repository;

import com.movieticket.app.entity.Screen;
import com.movieticket.app.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByScreen(Screen screen);
    List<Seat> findByScreenOrderByRowLabelAscSeatNumberAsc(Screen screen);

    /** See {@code ShowRepository.deleteByIdInBulk} for why this isn't {@code deleteAll}. */
    @Modifying
    @Query("delete from Seat s where s.id in :seatIds")
    int deleteByIdsInBulk(@Param("seatIds") List<Long> seatIds);

    @Modifying
    @Query("delete from Seat s where s.screen.id = :screenId")
    int deleteByScreenId(@Param("screenId") Long screenId);
}

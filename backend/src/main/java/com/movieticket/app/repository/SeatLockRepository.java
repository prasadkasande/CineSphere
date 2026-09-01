package com.movieticket.app.repository;

import com.movieticket.app.entity.SeatLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SeatLockRepository extends JpaRepository<SeatLock, Long> {

    List<SeatLock> findByShowIdAndSeat_IdIn(Long showId, List<Long> seatIds);

    List<SeatLock> findByShowIdAndLockedBy_IdAndSeat_IdIn(Long showId, Long userId, List<Long> seatIds);

    @Modifying
    @Query("delete from SeatLock l where l.expiresAt < :now")
    int deleteExpired(@Param("now") LocalDateTime now);

    @Modifying
    @Query("delete from SeatLock l where l.showId = :showId")
    int deleteByShowId(@Param("showId") Long showId);

    @Modifying
    @Query("delete from SeatLock l where l.lockedBy.id = :userId")
    int deleteByLockedBy(@Param("userId") Long userId);

    @Modifying
    @Query("delete from SeatLock l where l.seat.id in :seatIds")
    int deleteBySeatIds(@Param("seatIds") List<Long> seatIds);

    @Modifying
    @Query("delete from SeatLock l where l.seat.screen.id = :screenId")
    int deleteByScreenId(@Param("screenId") Long screenId);
}

package com.movieticket.app.repository;

import com.movieticket.app.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {

    List<BookingSeat> findByShowId(Long showId);

    /**
     * Confirmed tickets sitting on any of these seats - the guard that stops a
     * layout edit from deleting a seat somebody has already paid for.
     */
    @Query("select bs from BookingSeat bs where bs.seat.id in :seatIds " +
            "and bs.booking.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    List<BookingSeat> findConfirmedForSeats(@Param("seatIds") List<Long> seatIds);

    @Modifying
    @Query("delete from BookingSeat bs where bs.showId = :showId")
    int deleteByShowId(@Param("showId") Long showId);

    @Modifying
    @Query("delete from BookingSeat bs where bs.booking.user.id = :userId")
    int deleteByBookingUser(@Param("userId") Long userId);
}

package com.movieticket.app.repository;

import com.movieticket.app.entity.Booking;
import com.movieticket.app.entity.Show;
import com.movieticket.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserOrderByBookingTimeDesc(User user);

    List<Booking> findByShow(Show show);

    long countByStatus(com.movieticket.app.entity.BookingStatus status);

    @Query("select coalesce(sum(b.totalAmount), 0) from Booking b " +
            "where b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    BigDecimal sumConfirmedRevenue();

    @Query("select coalesce(sum(b.totalAmount), 0) from Booking b " +
            "where b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED " +
            "and b.show.screen.theatre.owner.id = :ownerId")
    BigDecimal sumConfirmedRevenueForOwner(@Param("ownerId") Long ownerId);

    @Query("select count(bs) from BookingSeat bs " +
            "where bs.booking.status = com.movieticket.app.entity.BookingStatus.CONFIRMED " +
            "and bs.booking.show.screen.theatre.owner.id = :ownerId")
    long countSeatsSoldForOwner(@Param("ownerId") Long ownerId);

    @Query("select count(bs) from BookingSeat bs " +
            "where bs.booking.status = com.movieticket.app.entity.BookingStatus.CONFIRMED " +
            "and bs.booking.show.movie.creator.id = :creatorId")
    long countSeatsSoldForCreator(@Param("creatorId") Long creatorId);

    /* ---------- guards for admin deletion ----------
       A delete is refused when it would destroy confirmed ticket sales. */

    @Query("select count(b) from Booking b where b.show.movie.id = :movieId " +
            "and b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    long countConfirmedForMovie(@Param("movieId") Long movieId);

    @Query("select count(b) from Booking b where b.show.screen.theatre.id = :theatreId " +
            "and b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    long countConfirmedForTheatre(@Param("theatreId") Long theatreId);

    @Query("select count(b) from Booking b where b.show.screen.theatre.owner.id = :ownerId " +
            "and b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    long countConfirmedForOwner(@Param("ownerId") Long ownerId);

    @Query("select count(b) from Booking b where b.show.movie.creator.id = :creatorId " +
            "and b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    long countConfirmedForCreator(@Param("creatorId") Long creatorId);

    /* Confirmed bookings that a pending deletion would have to refund. */

    @Query("select b from Booking b where b.show.movie.id = :movieId " +
            "and b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    List<Booking> findConfirmedForMovie(@Param("movieId") Long movieId);

    @Query("select b from Booking b where b.show.screen.theatre.id = :theatreId " +
            "and b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    List<Booking> findConfirmedForTheatre(@Param("theatreId") Long theatreId);

    @Query("select b from Booking b where b.show.screen.theatre.owner.id = :ownerId " +
            "and b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    List<Booking> findConfirmedForOwner(@Param("ownerId") Long ownerId);

    @Query("select b from Booking b where b.show.screen.id = :screenId " +
            "and b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    List<Booking> findConfirmedForScreen(@Param("screenId") Long screenId);

    @Query("select b from Booking b where b.show.movie.creator.id = :creatorId " +
            "and b.status = com.movieticket.app.entity.BookingStatus.CONFIRMED")
    List<Booking> findConfirmedForCreator(@Param("creatorId") Long creatorId);

    @Modifying
    @Query("delete from Booking b where b.show.id = :showId")
    int deleteByShowId(@Param("showId") Long showId);

    @Modifying
    @Query("delete from Booking b where b.user.id = :userId")
    int deleteByUserId(@Param("userId") Long userId);
}

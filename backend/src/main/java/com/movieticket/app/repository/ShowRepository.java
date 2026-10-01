package com.movieticket.app.repository;

import com.movieticket.app.entity.Screen;
import com.movieticket.app.entity.Show;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowRepository extends JpaRepository<Show, Long> {

    List<Show> findByScreen_Id(Long screenId);

    /**
     * Bulk delete, not {@code delete(Show)} - a Show scheduled for entity-level
     * removal inside the SAME transaction that also bulk-deletes rows
     * referencing it (Booking, BookingSeat, SeatLock all denormalize their FK
     * as a plain Long, but Booking.show is a real association) trips
     * Hibernate's flush-time "unsaved transient instance" check the moment any
     * other still-session-tracked entity holds a to-one reference to it. This
     * sidesteps that entirely by never engaging the entity-level delete path.
     */
    @Modifying
    @Query("delete from Show s where s.id = :id")
    void deleteByIdInBulk(@Param("id") Long id);

    /**
     * The customer-facing showtime list, bounded to a window. A recurring run
     * can be 300 screenings long; a customer picking a seat for tonight has no
     * use for the other 290, and shipping them all made the page unreadable.
     */
    @Query("select s from Show s where s.movie.id = :movieId " +
            "and (cast(:city as String) is null or lower(s.screen.theatre.city) = lower(cast(:city as String))) " +
            "and s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED " +
            "and s.showDateTime >= :from and s.showDateTime < :to " +
            "order by s.showDateTime asc")
    List<Show> findShowsForMovieInWindow(@Param("movieId") Long movieId,
                                         @Param("city") String city,
                                         @Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);

    /**
     * When the window comes back empty we still want to tell the customer when
     * the film next plays, rather than leaving them on a bare "no shows".
     */
    @Query("select min(s.showDateTime) from Show s where s.movie.id = :movieId " +
            "and (cast(:city as String) is null or lower(s.screen.theatre.city) = lower(cast(:city as String))) " +
            "and s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED " +
            "and s.showDateTime >= :from")
    LocalDateTime findNextShowTime(@Param("movieId") Long movieId,
                                   @Param("city") String city,
                                   @Param("from") LocalDateTime from);

    List<Show> findByScreen_Theatre_Owner_Id(Long ownerId);

    long countByScreen_Theatre_Owner_Id(Long ownerId);

    long countByScreen_Theatre_Owner_IdAndShowDateTimeAfter(Long ownerId, LocalDateTime from);

    long countByMovie_Creator_Id(Long creatorId);

    @Query("select count(distinct s.screen.theatre.id) from Show s where s.movie.creator.id = :creatorId")
    long countDistinctTheatresForCreator(@Param("creatorId") Long creatorId);

    /**
     * Total seat capacity across all of an owner's shows - the denominator for
     * the occupancy rate.
     */
    @Query("select count(seat) from Show s join Seat seat on seat.screen.id = s.screen.id " +
            "where s.screen.theatre.owner.id = :ownerId")
    long countTotalSeatCapacityForOwner(@Param("ownerId") Long ownerId);

    /**
     * Retires screenings whose start time has passed. Bulk update so the hourly
     * churn never loads a growing list of shows into memory.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Show s set s.status = com.movieticket.app.entity.ShowStatus.COMPLETED " +
            "where s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED and s.showDateTime < :now")
    int markPastShowsCompleted(@Param("now") LocalDateTime now);

    /**
     * Every live screening on a screen from :from onwards. Overlap is worked out
     * in Java rather than SQL because each show's runtime comes from its own
     * movie, so one query can answer a whole recurring plan's conflict check.
     */
    @Query("select s from Show s where s.screen.id = :screenId " +
            "and s.status <> com.movieticket.app.entity.ShowStatus.CANCELLED " +
            "and s.showDateTime >= :from order by s.showDateTime asc")
    List<Show> findOnScreenFrom(@Param("screenId") Long screenId, @Param("from") LocalDateTime from);

    /* ---------- admin deletion ---------- */

    List<Show> findByMovie_Id(Long movieId);

    List<Show> findByScreen_Theatre_Id(Long theatreId);

    List<Show> findByMovie_Creator_Id(Long creatorId);

    /**
     * Upcoming show counts keyed by movie id, fetched in one query so the admin
     * movie list doesn't issue a count per row.
     */
    @Query("select s.movie.id, count(s) from Show s " +
            "where s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED " +
            "and s.showDateTime >= :now group by s.movie.id")
    List<Object[]> countUpcomingShowsByMovie(@Param("now") LocalDateTime now);
}

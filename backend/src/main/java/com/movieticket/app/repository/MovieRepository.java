package com.movieticket.app.repository;

import com.movieticket.app.entity.ApprovalStatus;
import com.movieticket.app.entity.Movie;
import com.movieticket.app.entity.MovieStatus;
import com.movieticket.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    /** See {@code ShowRepository.deleteByIdInBulk} for why this isn't {@code delete(Movie)}. */
    @Modifying
    @Query("delete from Movie m where m.id = :id")
    void deleteByIdInBulk(@Param("id") Long id);


    List<Movie> findByCreator(User creator);

    List<Movie> findByApprovalStatusOrderByIdDesc(ApprovalStatus approvalStatus);

    /** Ignores show availability - used at seed time, before any show exists. */
    List<Movie> findByStatusAndApprovalStatus(MovieStatus status, ApprovalStatus approvalStatus);

    long countByApprovalStatus(ApprovalStatus approvalStatus);

    long countByCreator_Id(Long creatorId);

    long countByCreator_IdAndStatus(Long creatorId, MovieStatus status);

    /**
     * Public catalogue browse. Optional filters short-circuit on null, so one
     * query serves the unfiltered browse and every filter combination. Only
     * admin-approved titles are ever returned.
     */
    @Query("select m from Movie m where " +
            "m.approvalStatus = com.movieticket.app.entity.ApprovalStatus.APPROVED and " +
            "exists (select 1 from Show s where s.movie.id = m.id " +
            "        and s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED " +
            "        and s.showDateTime >= :now) and " +
            "(:status is null or m.status = :status) and " +
            "(cast(:search as String) is null or lower(m.title) like lower(concat('%', cast(:search as String), '%'))) and " +
            "(cast(:genre as String) is null or lower(m.genre) = lower(cast(:genre as String))) and " +
            "(cast(:language as String) is null or lower(m.language) = lower(cast(:language as String)))")
    /*
     * The nullable String parameters are cast explicitly: an untyped null
     * binds as `bytea` on Postgres, and `lower(bytea)` is not a function.
     * H2 accepts it, so this only ever fails against the real database.
     */
    List<Movie> search(@Param("status") MovieStatus status,
                       @Param("search") String search,
                       @Param("genre") String genre,
                       @Param("language") String language,
                       @Param("now") LocalDateTime now);

    /** Approved, bookable titles with a given release status - backs the hero fallback. */
    @Query("select m from Movie m where m.status = :status " +
            "and m.approvalStatus = com.movieticket.app.entity.ApprovalStatus.APPROVED " +
            "and exists (select 1 from Show s where s.movie.id = m.id " +
            "            and s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED " +
            "            and s.showDateTime >= :now) " +
            "order by m.id desc")
    List<Movie> findApprovedBookableByStatus(@Param("status") MovieStatus status,
                                              @Param("now") LocalDateTime now);

    /**
     * Admin-curated hero rotation. Also requires a bookable show so the hero's
     * "Book tickets" call to action never leads to a dead end.
     */
    @Query("select m from Movie m where m.featured = true " +
            "and m.approvalStatus = com.movieticket.app.entity.ApprovalStatus.APPROVED " +
            "and m.status <> com.movieticket.app.entity.MovieStatus.ARCHIVED " +
            "and exists (select 1 from Show s where s.movie.id = m.id " +
            "            and s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED " +
            "            and s.showDateTime >= :now) " +
            "order by m.featuredOrder asc, m.id asc")
    List<Movie> findFeatured(@Param("now") LocalDateTime now);

    @Query("select coalesce(max(m.featuredOrder), 0) from Movie m where m.featured = true")
    int maxFeaturedOrder();

    /**
     * Every title an owner is allowed to put on a screen: admin-approved and not
     * archived. Deliberately does NOT require an existing show - the public
     * catalogue query does, and using that here left the owner's "Schedule a
     * show" dropdown empty until someone else had already scheduled the movie.
     */
    @Query("select m from Movie m where m.status <> com.movieticket.app.entity.MovieStatus.ARCHIVED " +
            "and m.approvalStatus = com.movieticket.app.entity.ApprovalStatus.APPROVED " +
            "order by m.title asc")
    List<Movie> findSchedulable();

    /**
     * Approved movies this owner has never scheduled at any of their theatres -
     * the programming gaps surfaced on the owner's Shows tab.
     */
    /**
     * "Not scheduled" means no upcoming SCHEDULED show right now - not "never
     * scheduled, ever". A movie whose only run already finished (COMPLETED) is
     * a programming gap again, so it must resurface here, not vanish for good.
     */
    @Query("select m from Movie m where m.status <> com.movieticket.app.entity.MovieStatus.ARCHIVED " +
            "and m.approvalStatus = com.movieticket.app.entity.ApprovalStatus.APPROVED " +
            "and m.id not in (select s.movie.id from Show s where s.screen.theatre.owner.id = :ownerId " +
            "                 and s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED " +
            "                 and s.showDateTime >= :now) " +
            "order by m.status asc, m.title asc")
    List<Movie> findNotFeaturedByOwner(@Param("ownerId") Long ownerId, @Param("now") LocalDateTime now);

    /* Facets mirror what the customer can actually browse, so the dropdowns
       never offer a filter that yields nothing. */

    @Query("select distinct m.genre from Movie m where m.genre is not null " +
            "and m.approvalStatus = com.movieticket.app.entity.ApprovalStatus.APPROVED " +
            "and exists (select 1 from Show s where s.movie.id = m.id " +
            "            and s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED " +
            "            and s.showDateTime >= :now) " +
            "order by m.genre")
    List<String> findDistinctGenres(@Param("now") LocalDateTime now);

    @Query("select distinct m.language from Movie m where m.language is not null " +
            "and m.approvalStatus = com.movieticket.app.entity.ApprovalStatus.APPROVED " +
            "and exists (select 1 from Show s where s.movie.id = m.id " +
            "            and s.status = com.movieticket.app.entity.ShowStatus.SCHEDULED " +
            "            and s.showDateTime >= :now) " +
            "order by m.language")
    List<String> findDistinctLanguages(@Param("now") LocalDateTime now);
}

package com.movieticket.app.repository;

import com.movieticket.app.entity.Theatre;
import com.movieticket.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TheatreRepository extends JpaRepository<Theatre, Long> {
    List<Theatre> findByOwner(User owner);
    List<Theatre> findByApproved(boolean approved);
    long countByOwner_Id(Long ownerId);
    long countByOwner_IdAndApproved(Long ownerId, boolean approved);
    long countByApproved(boolean approved);
    List<Theatre> findByOwner_Id(Long ownerId);

    /** The admin queue: awaiting a decision, not ones already sent back. */
    List<Theatre> findByApprovedFalseAndRejectedAtIsNull();

    /** Rejected registrations awaiting purge. */
    List<Theatre> findByRejectedAtNotNull();

    /** See {@code ShowRepository.deleteByIdInBulk} for why this isn't {@code delete(Theatre)}. */
    @Modifying
    @Query("delete from Theatre t where t.id = :id")
    void deleteByIdInBulk(@Param("id") Long id);
}

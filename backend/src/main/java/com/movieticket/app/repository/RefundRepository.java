package com.movieticket.app.repository;

import com.movieticket.app.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByUser_IdOrderByRefundedAtDesc(Long userId);

    /** Detaches refunds from a deleted account while keeping the audit row. */
    @Modifying
    @Query("update Refund r set r.user = null where r.user.id = :userId")
    int detachFromUser(@Param("userId") Long userId);
}

package com.movieticket.app.repository;

import com.movieticket.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByApprovedFalse();
    List<User> findByRejectedAtNotNull();
    long countByApprovedFalse();
    long countByRole(com.movieticket.app.entity.Role role);

    /** See {@code ShowRepository.deleteByIdInBulk} for why this isn't {@code delete(User)}. */
    @Modifying
    @Query("delete from User u where u.id = :id")
    void deleteByIdInBulk(@Param("id") Long id);
}

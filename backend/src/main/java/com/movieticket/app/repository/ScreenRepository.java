package com.movieticket.app.repository;

import com.movieticket.app.entity.Screen;
import com.movieticket.app.entity.Theatre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ScreenRepository extends JpaRepository<Screen, Long> {
    List<Screen> findByTheatre(Theatre theatre);
    long countByTheatre_Owner_Id(Long ownerId);
    List<Screen> findByTheatre_Id(Long theatreId);

    /** See {@code ShowRepository.deleteByIdInBulk} for why this isn't {@code delete(Screen)}. */
    @Modifying
    @Query("delete from Screen s where s.id = :id")
    void deleteByIdInBulk(@Param("id") Long id);

    @Modifying
    @Query("delete from Screen s where s.theatre.id = :theatreId")
    void deleteByTheatreIdInBulk(@Param("theatreId") Long theatreId);
}

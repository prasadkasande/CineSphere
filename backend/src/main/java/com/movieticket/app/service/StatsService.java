package com.movieticket.app.service;

import com.movieticket.app.dto.stats.AdminStatsResponse;
import com.movieticket.app.dto.stats.CreatorStatsResponse;
import com.movieticket.app.dto.stats.OwnerStatsResponse;
import com.movieticket.app.entity.ApprovalStatus;
import com.movieticket.app.entity.BookingStatus;
import com.movieticket.app.entity.MovieStatus;
import com.movieticket.app.entity.Role;
import com.movieticket.app.repository.*;
import com.movieticket.app.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final TheatreRepository theatreRepository;
    private final ScreenRepository screenRepository;
    private final ShowRepository showRepository;
    private final BookingRepository bookingRepository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public OwnerStatsResponse ownerStats() {
        Long ownerId = currentUser.id();

        long seatsSold = bookingRepository.countSeatsSoldForOwner(ownerId);
        long capacity = showRepository.countTotalSeatCapacityForOwner(ownerId);
        double occupancy = capacity == 0 ? 0d : (double) seatsSold / capacity * 100d;

        return new OwnerStatsResponse(
                theatreRepository.countByOwner_Id(ownerId),
                theatreRepository.countByOwner_IdAndApproved(ownerId, true),
                screenRepository.countByTheatre_Owner_Id(ownerId),
                showRepository.countByScreen_Theatre_Owner_IdAndShowDateTimeAfter(ownerId, LocalDateTime.now()),
                showRepository.countByScreen_Theatre_Owner_Id(ownerId),
                seatsSold,
                bookingRepository.sumConfirmedRevenueForOwner(ownerId),
                Math.round(occupancy * 10d) / 10d
        );
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse adminStats() {
        return new AdminStatsResponse(
                userRepository.count(),
                userRepository.countByRole(Role.CUSTOMER),
                theatreRepository.count(),
                movieRepository.count(),
                bookingRepository.countByStatus(BookingStatus.CONFIRMED),
                theatreRepository.countByApproved(false),
                userRepository.countByApprovedFalse(),
                movieRepository.countByApprovalStatus(ApprovalStatus.PENDING),
                bookingRepository.sumConfirmedRevenue()
        );
    }

    @Transactional(readOnly = true)
    public CreatorStatsResponse creatorStats() {
        Long creatorId = currentUser.id();
        return new CreatorStatsResponse(
                movieRepository.countByCreator_Id(creatorId),
                movieRepository.countByCreator_IdAndStatus(creatorId, MovieStatus.NOW_SHOWING),
                movieRepository.countByCreator_IdAndStatus(creatorId, MovieStatus.UPCOMING),
                showRepository.countByMovie_Creator_Id(creatorId),
                showRepository.countDistinctTheatresForCreator(creatorId),
                bookingRepository.countSeatsSoldForCreator(creatorId)
        );
    }
}

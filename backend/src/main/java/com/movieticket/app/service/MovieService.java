package com.movieticket.app.service;

import com.movieticket.app.dto.admin.AdminMovieResponse;
import com.movieticket.app.dto.movie.MovieFiltersResponse;
import com.movieticket.app.dto.movie.MovieRequest;
import com.movieticket.app.dto.movie.MovieResponse;
import com.movieticket.app.entity.ApprovalStatus;
import com.movieticket.app.entity.Movie;
import com.movieticket.app.entity.MovieStatus;
import com.movieticket.app.entity.User;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.exception.ResourceNotFoundException;
import com.movieticket.app.repository.MovieRepository;
import com.movieticket.app.repository.ShowRepository;
import com.movieticket.app.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final FileStorageService fileStorageService;
    private final ShowRepository showRepository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<MovieResponse> list(MovieStatus status) {
        return search(status, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<MovieResponse> search(MovieStatus status, String query, String genre, String language, String sort) {
        List<Movie> movies = movieRepository.search(
                status, blankToNull(query), blankToNull(genre), blankToNull(language), LocalDateTime.now());

        Comparator<Movie> comparator = switch (sort == null ? "" : sort) {
            case "title" -> Comparator.comparing(Movie::getTitle, String.CASE_INSENSITIVE_ORDER);
            case "duration" -> Comparator.comparing(Movie::getDurationMins, Comparator.nullsLast(Comparator.naturalOrder()));
            // Newest first is the sensible default for a catalogue.
            default -> Comparator.comparing(Movie::getId).reversed();
        };

        return movies.stream().sorted(comparator).map(MovieResponse::from).toList();
    }

    /**
     * Every movie, unfiltered - the admin must be able to moderate titles that
     * aren't reaching customers yet (no theatre has scheduled them).
     */
    @Transactional(readOnly = true)
    public List<AdminMovieResponse> listAllForAdmin() {
        Map<Long, Long> showCounts = showRepository.countUpcomingShowsByMovie(LocalDateTime.now())
                .stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        return movieRepository.findAll().stream()
                .sorted(Comparator.comparing(Movie::getId).reversed())
                .map(m -> AdminMovieResponse.from(m, showCounts.getOrDefault(m.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public MovieFiltersResponse filters() {
        LocalDateTime now = LocalDateTime.now();
        return new MovieFiltersResponse(
                movieRepository.findDistinctGenres(now).stream().filter(g -> g != null && !g.isBlank()).toList(),
                movieRepository.findDistinctLanguages(now).stream().filter(l -> l != null && !l.isBlank()).toList()
        );
    }

    /**
     * Admin-curated hero rotation. Falls back to the newest now-showing titles
     * so the home page hero is never empty before an admin curates it.
     */
    @Transactional(readOnly = true)
    public List<MovieResponse> featured() {
        LocalDateTime now = LocalDateTime.now();
        List<Movie> curated = movieRepository.findFeatured(now);
        if (!curated.isEmpty()) {
            return curated.stream().map(MovieResponse::from).toList();
        }
        return movieRepository.findApprovedBookableByStatus(MovieStatus.NOW_SHOWING, now).stream()
                .limit(5)
                .map(MovieResponse::from)
                .toList();
    }

    @Transactional
    public MovieResponse setFeatured(Long id, boolean featured) {
        Movie movie = findEntity(id);
        if (featured && movie.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new BadRequestException("Only approved movies can be featured on the homepage");
        }
        if (featured && !movie.isFeatured()) {
            // Append to the end of the current rotation.
            movie.setFeaturedOrder(movieRepository.maxFeaturedOrder() + 1);
        }
        movie.setFeatured(featured);
        return MovieResponse.from(movieRepository.save(movie));
    }

    /* ---------- admin review queue ---------- */

    @Transactional(readOnly = true)
    public List<MovieResponse> pendingApproval() {
        return movieRepository.findByApprovalStatusOrderByIdDesc(ApprovalStatus.PENDING)
                .stream().map(MovieResponse::from).toList();
    }

    @Transactional
    public MovieResponse review(Long id, ApprovalStatus decision, String reason) {
        if (decision != ApprovalStatus.APPROVED && decision != ApprovalStatus.REJECTED) {
            throw new BadRequestException("Review decision must be APPROVED or REJECTED");
        }
        Movie movie = findEntity(id);
        movie.setApprovalStatus(decision);
        if (decision == ApprovalStatus.REJECTED) {
            // A rejected title must not linger in the homepage rotation.
            movie.setFeatured(false);
            movie.setRejectionReason(reason);
        } else {
            // Approving clears any earlier rejection note.
            movie.setRejectionReason(null);
        }
        return MovieResponse.from(movieRepository.save(movie));
    }

    /**
     * A creator puts a rejected title back in the queue after acting on the
     * admin's note. Editing alone deliberately doesn't do this - a live,
     * already-approved title must not drop offline just because a typo was
     * fixed - so a rejected movie needs this explicit step.
     */
    @Transactional
    public MovieResponse resubmit(Long id) {
        Movie movie = findEntity(id);
        requireCreatorOwner(movie);

        if (movie.getApprovalStatus() != ApprovalStatus.REJECTED) {
            throw new BadRequestException("Only a rejected movie can be resubmitted for approval");
        }
        movie.setApprovalStatus(ApprovalStatus.PENDING);
        movie.setRejectionReason(null);
        return MovieResponse.from(movieRepository.save(movie));
    }

    /** Every approved, non-archived title an owner may schedule on a screen. */
    @Transactional(readOnly = true)
    public List<MovieResponse> schedulable() {
        return movieRepository.findSchedulable().stream().map(MovieResponse::from).toList();
    }

    /** Movies this owner has never scheduled at any of their theatres. */
    @Transactional(readOnly = true)
    public List<MovieResponse> notFeaturedForCurrentOwner() {
        return movieRepository.findNotFeaturedByOwner(currentUser.id(), LocalDateTime.now())
                .stream().map(MovieResponse::from).toList();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional(readOnly = true)
    public MovieResponse get(Long id) {
        return MovieResponse.from(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<MovieResponse> myMovies() {
        User creator = currentUser.entity();
        return movieRepository.findByCreator(creator).stream().map(MovieResponse::from).toList();
    }

    Movie findEntity(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found: " + id));
    }

    @Transactional
    public MovieResponse createByCreator(MovieRequest request, MultipartFile coverImage) {
        User creator = currentUser.entity();
        String coverImageUrl = fileStorageService.storeCoverImage(coverImage);

        Movie movie = Movie.builder()
                .title(request.title())
                .description(request.description())
                .genre(request.genre())
                .language(request.language())
                .durationMins(request.durationMins())
                .coverImageUrl(coverImageUrl)
                .censorRating(request.censorRating())
                .status(request.status())
                .creator(creator)
                // Submissions go into the admin review queue, not straight live.
                .approvalStatus(ApprovalStatus.PENDING)
                .build();
        return MovieResponse.from(movieRepository.save(movie));
    }

    @Transactional
    public MovieResponse updateByCreator(Long id, MovieRequest request, MultipartFile coverImage) {
        Movie movie = findEntity(id);
        requireCreatorOwner(movie);

        movie.setTitle(request.title());
        movie.setDescription(request.description());
        movie.setGenre(request.genre());
        movie.setLanguage(request.language());
        movie.setDurationMins(request.durationMins());
        movie.setCensorRating(request.censorRating());
        movie.setStatus(request.status());
        if (coverImage != null && !coverImage.isEmpty()) {
            String previous = movie.getCoverImageUrl();
            movie.setCoverImageUrl(fileStorageService.storeCoverImage(coverImage));
            // Only ours gets dropped; a seeded external URL is left alone.
            fileStorageService.deleteByUrl(previous);
        }
        return MovieResponse.from(movieRepository.save(movie));
    }

    @Transactional
    public void deleteByCreator(Long id) {
        Movie movie = findEntity(id);
        requireCreatorOwner(movie);
        movieRepository.delete(movie);
    }

    /** Safe alternative to deleting: hides a title without touching bookings. */
    @Transactional
    public MovieResponse archive(Long id) {
        Movie movie = findEntity(id);
        movie.setStatus(MovieStatus.ARCHIVED);
        movie.setFeatured(false);
        return MovieResponse.from(movieRepository.save(movie));
    }

    @Transactional
    public void delete(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie not found: " + id);
        }
        movieRepository.deleteById(id);
    }

    private void requireCreatorOwner(Movie movie) {
        if (!movie.getCreator().getId().equals(currentUser.id())) {
            throw new AccessDeniedException("You do not own this movie");
        }
    }
}

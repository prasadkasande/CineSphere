package com.movieticket.app.service;

import com.movieticket.app.entity.StoredImage;
import com.movieticket.app.exception.BadRequestException;
import com.movieticket.app.repository.StoredImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.UUID;

/**
 * Stores uploaded cover images in the database rather than on disk - see
 * {@link StoredImage} for why. The returned URL keeps the original
 * {@code /uploads/covers/...} shape so nothing downstream (the DB column, the
 * API responses, the frontend) had to change; only what sits behind that path
 * is different, and {@code CoverImageController} serves it.
 */
@Service
@RequiredArgsConstructor
public class FileStorageService {

    /** Mirrors spring.servlet.multipart.max-file-size, enforced here too. */
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    public static final String URL_PREFIX = "/uploads/covers/";

    private final StoredImageRepository storedImageRepository;

    @Transactional
    public String storeCoverImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Cover image file is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Cover image must be an image file");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("Cover image must be 5 MB or smaller");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read cover image", e);
        }

        StoredImage image = StoredImage.builder()
                .id(UUID.randomUUID().toString())
                .contentType(contentType)
                .sizeBytes(bytes.length)
                .data(bytes)
                .createdAt(Instant.now())
                .build();
        storedImageRepository.save(image);

        return URL_PREFIX + image.getId();
    }

    /**
     * Drops the image a URL points at, if it is one of ours. Called when a
     * cover is replaced so the old bytes don't linger - a free Postgres tier
     * is not the place to accumulate orphaned blobs. A URL from anywhere else
     * (the seeded picsum links, or a legacy on-disk path) is ignored.
     */
    @Transactional
    public void deleteByUrl(String url) {
        if (url == null || !url.startsWith(URL_PREFIX)) return;
        String id = url.substring(URL_PREFIX.length());
        storedImageRepository.deleteById(id);
    }
}

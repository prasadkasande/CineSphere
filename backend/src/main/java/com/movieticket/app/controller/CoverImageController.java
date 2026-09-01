package com.movieticket.app.controller;

import com.movieticket.app.entity.StoredImage;
import com.movieticket.app.repository.StoredImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

/**
 * Serves cover images from the database, falling back to the filesystem.
 *
 * <p>The fallback is what keeps a developer's existing uploads working: images
 * stored before {@link StoredImage} existed are still sitting in the local
 * {@code uploads/covers} directory, and their movie rows still point at them.
 * New uploads never take that path.
 */
@RestController
@RequiredArgsConstructor
public class CoverImageController {

    private final StoredImageRepository storedImageRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping("/uploads/covers/{name}")
    public ResponseEntity<?> cover(@PathVariable String name) {
        // Images are immutable - a new upload gets a new id - so they can be
        // cached hard, which matters on a free tier that sleeps.
        CacheControl cache = CacheControl.maxAge(Duration.ofDays(365)).cachePublic();

        return storedImageRepository.findById(name)
                .map(image -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(image.getContentType()))
                        .cacheControl(cache)
                        .<Object>body(image.getData()))
                .orElseGet(() -> legacyFromDisk(name, cache));
    }

    private ResponseEntity<Object> legacyFromDisk(String name, CacheControl cache) {
        // `name` arrives from the URL: refuse anything that could climb out of
        // the covers directory before it reaches the filesystem.
        if (name.contains("..") || name.contains("/") || name.contains("\\")) {
            return ResponseEntity.notFound().build();
        }
        Path file = Path.of(uploadDir, "covers", name).toAbsolutePath().normalize();
        if (!Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        MediaType type = MediaType.APPLICATION_OCTET_STREAM;
        try {
            String probed = Files.probeContentType(file);
            if (probed != null) type = MediaType.parseMediaType(probed);
        } catch (Exception ignored) {
            // Fall through with the generic type; the browser sniffs it.
        }
        return ResponseEntity.ok().contentType(type).cacheControl(cache).body(resource);
    }
}

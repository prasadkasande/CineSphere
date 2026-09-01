package com.movieticket.app.repository;

import com.movieticket.app.entity.StoredImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoredImageRepository extends JpaRepository<StoredImage, String> {
}

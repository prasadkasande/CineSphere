package com.movieticket.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cover images are no longer served by a static resource handler: they live in
 * the database now, so {@code CoverImageController} answers
 * {@code /uploads/covers/**} (and falls back to the old on-disk location for
 * images uploaded before that change).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
}

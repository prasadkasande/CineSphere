package com.movieticket.app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * An uploaded cover image, bytes and all, held in the database.
 *
 * <p>Cover images used to be written to the server's filesystem with only the
 * path stored in a {@code Movie} row. That works on a development machine and
 * fails on any host with an ephemeral disk - the row survives pointing at a
 * file the next deploy deleted, so the movie renders with a broken poster.
 * Keeping the bytes alongside the row means artwork lives exactly as long as
 * the movie does.
 *
 * <p>Uploads are capped at 5 MB by {@code spring.servlet.multipart}, so a
 * plain {@code byte[]} with an explicit length is the right mapping - it
 * becomes {@code bytea} on Postgres and {@code varbinary} on H2. Deliberately
 * <em>not</em> {@code @Lob}: Hibernate 6 maps a large-object byte array to a
 * Postgres {@code oid}, which needs its own transaction handling and breaks
 * with {@code open-in-view=false}.
 */
@Entity
@Table(name = "stored_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoredImage {

    /** A UUID, and also the last segment of the public URL. */
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private long sizeBytes;

    /** 6 MB ceiling against a 5 MB upload limit, leaving headroom. */
    @Column(nullable = false, length = 6 * 1024 * 1024)
    private byte[] data;

    @Column(nullable = false)
    private Instant createdAt;
}

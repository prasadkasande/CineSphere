package com.movieticket.app.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Refuses to start the production profile with development credentials.
 *
 * <p>The repository is public, so the defaults in {@code application.properties}
 * are readable by anyone. They are fine on a laptop and catastrophic in
 * production: the JWT signing key is all that stands between a stranger and a
 * forged admin token. An environment variable that silently failed to reach
 * the container would otherwise leave the app running happily on the published
 * key, which is exactly the kind of failure nobody notices until it is
 * exploited - so it is made loud and fatal instead.
 */
@Configuration
@Profile("prod")
@Slf4j
public class ProductionSecretsCheck {

    /** The value committed to the repository - never valid in production. */
    private static final String DEV_JWT_SECRET =
            "change-this-super-secret-key-for-movie-ticket-app-min-256-bits-long";
    private static final String DEV_ADMIN_PASSWORD = "Admin@123";

    /** HS512 needs 512 bits of key material; below that jjwt refuses to sign. */
    private static final int MIN_SECRET_BYTES = 64;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.seed.admin-password}")
    private String adminPassword;

    @PostConstruct
    public void verify() {
        if (DEV_JWT_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException(
                    "APP_JWT_SECRET is still the development default from the public repository. "
                            + "Set a real value (openssl rand -base64 48) before deploying.");
        }
        if (jwtSecret == null || jwtSecret.getBytes().length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "APP_JWT_SECRET must be at least " + MIN_SECRET_BYTES
                            + " bytes for HS512; got " + (jwtSecret == null ? 0 : jwtSecret.getBytes().length));
        }
        if (DEV_ADMIN_PASSWORD.equals(adminPassword)) {
            throw new IllegalStateException(
                    "APP_SEED_ADMIN_PASSWORD is still the development default from the public "
                            + "repository. Set a real password before deploying.");
        }
        log.info("Production secrets check passed");
    }
}

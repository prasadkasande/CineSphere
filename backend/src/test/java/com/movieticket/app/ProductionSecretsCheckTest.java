package com.movieticket.app;

import com.movieticket.app.config.ProductionSecretsCheck;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Exercises the guard directly rather than by booting the prod profile: that
 * profile points at Postgres, and a test that needs a live Postgres to prove a
 * string comparison is a worse test, not a better one.
 */
class ProductionSecretsCheckTest {

    private static final String PUBLISHED_DEFAULT =
            "change-this-super-secret-key-for-movie-ticket-app-min-256-bits-long";
    private static final String GOOD_SECRET =
            "an-actually-random-production-signing-key-of-quite-sufficient-length";

    private ProductionSecretsCheck check(String secret, String adminPassword) {
        ProductionSecretsCheck c = new ProductionSecretsCheck();
        ReflectionTestUtils.setField(c, "jwtSecret", secret);
        ReflectionTestUtils.setField(c, "adminPassword", adminPassword);
        return c;
    }

    @Test
    void passesWithRealSecrets() {
        assertThatCode(() -> check(GOOD_SECRET, "a-real-password").verify())
                .doesNotThrowAnyException();
    }

    @Test
    void refusesThePublishedJwtDefault() {
        assertThatThrownBy(() -> check(PUBLISHED_DEFAULT, "a-real-password").verify())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_JWT_SECRET")
                .hasMessageContaining("development default");
    }

    @Test
    void refusesThePublishedAdminPassword() {
        assertThatThrownBy(() -> check(GOOD_SECRET, "Admin@123").verify())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_SEED_ADMIN_PASSWORD");
    }

    /** A short custom key is just as fatal - jjwt cannot sign HS512 with it. */
    @Test
    void refusesASecretTooShortForHs512() {
        assertThatThrownBy(() -> check("too-short", "a-real-password").verify())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 64 bytes");
    }

    @Test
    void refusesAMissingSecret() {
        assertThatThrownBy(() -> check(null, "a-real-password").verify())
                .isInstanceOf(IllegalStateException.class);
    }
}

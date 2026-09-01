package com.movieticket.app.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Widens every string-enum column from H2's native ENUM to plain varchar on
 * databases created before this patch existed.
 *
 * <p>Hibernate maps a Java enum held with {@code @Enumerated(STRING)} to a
 * native H2 ENUM whose permitted values are fixed at the moment the column is
 * created, and {@code ddl-auto=update} never widens an existing column's type.
 * A brand-new database (fresh {@code @Column(columnDefinition = "varchar(...)")}
 * on every affected field) never hits this; a database created before that
 * annotation existed still has the old native ENUM and rejects any value added
 * to the Java enum afterwards - discovered when adding {@code ShowStatus.COMPLETED}
 * broke the expiry job on every boot against the live database, and confirmed
 * to affect four more columns before {@code RefundReason.SCREEN_REMOVED} could
 * repeat the same failure.
 *
 * <p>Each entry is independent and idempotent: a column already widened (or a
 * table that doesn't exist yet, e.g. a fresh database) is silently skipped.
 */
@Component
@Slf4j
public class EnumColumnMigrationPatch implements ApplicationRunner {

    private record Migration(String table, String column, int varcharLength) {
    }

    private static final List<Migration> MIGRATIONS = List.of(
            new Migration("SHOWS", "STATUS", 20),
            new Migration("BOOKINGS", "STATUS", 20),
            new Migration("MOVIES", "STATUS", 20),
            new Migration("REFUNDS", "REASON", 30),
            new Migration("SEATS", "SEAT_TYPE", 20),
            new Migration("USERS", "ROLE", 20));

    private final JdbcTemplate jdbc;

    public EnumColumnMigrationPatch(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        // The ALTER below is H2 syntax, and the whole problem it fixes is an
        // H2 quirk. On Postgres every one of these lookups would miss (the
        // catalogue stores identifiers lower-case) and throw its way into the
        // catch, so skip the six pointless round trips entirely.
        if (!isH2()) {
            log.debug("Not an H2 database - enum column patch not applicable");
            return;
        }
        for (Migration m : MIGRATIONS) {
            widenIfNeeded(m);
        }
    }

    private boolean isH2() {
        try {
            String product = jdbc.execute(
                    (ConnectionCallback<String>) c -> c.getMetaData().getDatabaseProductName());
            return product != null && product.toLowerCase().contains("h2");
        } catch (Exception e) {
            return false;
        }
    }

    private void widenIfNeeded(Migration m) {
        try {
            String dataType = jdbc.queryForObject(
                    "select data_type from information_schema.columns "
                            + "where table_name = ? and column_name = ?",
                    String.class, m.table(), m.column());

            if (!"ENUM".equalsIgnoreCase(dataType)) return;

            jdbc.execute("alter table " + m.table() + " alter column " + m.column()
                    + " set data type varchar(" + m.varcharLength() + ")");
            log.info("Migrated {}.{} from a fixed ENUM to varchar({})", m.table(), m.column(), m.varcharLength());
        } catch (Exception e) {
            // A fresh database, a column that's already varchar, or a non-H2
            // database needs nothing here - never let this stop the app from starting.
            log.debug("{}.{} enum column patch skipped: {}", m.table(), m.column(), e.getMessage());
        }
    }
}

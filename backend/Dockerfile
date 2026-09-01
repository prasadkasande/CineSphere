# ============================================================
# Backend image. A Dockerfile rather than platform auto-detection so the
# JDK is pinned: the project targets Java 21, and a builder that guesses
# a different major version fails in ways that are tedious to diagnose
# from a deploy log.
# ============================================================

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Dependencies resolve from the POM alone, so this layer is cached across
# source-only changes.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

# Don't run as root.
RUN useradd --create-home --shell /bin/bash app
COPY --from=build /build/target/*.jar app.jar

# Matches APP_UPLOAD_DIR / the mounted volume; created up front so the
# directory exists and is writable even before the first upload.
RUN mkdir -p /app/uploads && chown -R app:app /app
USER app

# Tuned for a 512 MB free-tier container: cap the heap well below the limit so
# the JVM's own off-heap use doesn't trip the OOM killer, and keep the runtime
# lean since this instance cold-starts on every wake.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"
EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

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

# Sized for the container limit set in docker-compose.prod.yml, not for the
# host: MaxRAMPercentage reads the cgroup limit, so the heap tracks whatever
# mem_limit the app is given. SerialGC because the box has 2 cores and the
# heap is small - a concurrent collector would spend more on coordination
# than it saves. The JIT is deliberately left at full tiering: this process
# is long-lived, so paying C2 compilation once is worth it.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k"
EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

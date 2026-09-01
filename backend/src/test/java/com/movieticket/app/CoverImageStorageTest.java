package com.movieticket.app;

import com.movieticket.app.entity.StoredImage;
import com.movieticket.app.repository.StoredImageRepository;
import com.movieticket.app.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:covertest;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class CoverImageStorageTest {

    @Autowired FileStorageService fileStorageService;
    @Autowired StoredImageRepository storedImageRepository;
    @Autowired MockMvc mockMvc;

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10, 1, 2, 3};

    private MockMultipartFile png() {
        return new MockMultipartFile("coverImage", "poster.png", "image/png", PNG);
    }

    @Test
    void storedImageRoundTripsThroughTheDatabase() {
        String url = fileStorageService.storeCoverImage(png());
        assertThat(url).startsWith("/uploads/covers/");

        String id = url.substring("/uploads/covers/".length());
        StoredImage saved = storedImageRepository.findById(id).orElseThrow();
        assertThat(saved.getData()).isEqualTo(PNG);
        assertThat(saved.getContentType()).isEqualTo("image/png");
        assertThat(saved.getSizeBytes()).isEqualTo(PNG.length);
    }

    /** The whole point of the change: bytes come back over HTTP, not from disk. */
    @Test
    void controllerServesTheBytesWithItsContentType() throws Exception {
        String url = fileStorageService.storeCoverImage(png());

        mockMvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(PNG))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("max-age=31536000")));
    }

    @Test
    void unknownImageIsNotFound() throws Exception {
        mockMvc.perform(get("/uploads/covers/does-not-exist")).andExpect(status().isNotFound());
    }

    /**
     * The disk fallback takes a name straight from the URL, so it must refuse
     * anything that could climb out of the covers directory.
     */
    @Test
    void diskFallbackRefusesPathTraversal() throws Exception {
        for (String attack : new String[]{"..%2f..%2fapplication.properties", "..%5c..%5csecrets"}) {
            mockMvc.perform(get("/uploads/covers/" + attack))
                    .andExpect(status().is4xxClientError());
        }
    }

    @Test
    void replacingACoverDropsTheOldBytes() {
        String url = fileStorageService.storeCoverImage(png());
        String id = url.substring("/uploads/covers/".length());
        assertThat(storedImageRepository.findById(id)).isPresent();

        fileStorageService.deleteByUrl(url);
        assertThat(storedImageRepository.findById(id)).isEmpty();
    }

    /** A seeded picsum link must survive a delete call unscathed. */
    @Test
    void deleteIgnoresUrlsWeDidNotCreate() {
        long before = storedImageRepository.count();
        fileStorageService.deleteByUrl("https://picsum.photos/seed/galactic/400/600");
        fileStorageService.deleteByUrl(null);
        assertThat(storedImageRepository.count()).isEqualTo(before);
    }

    @Test
    void nonImageUploadsAreRejected() {
        MockMultipartFile pdf = new MockMultipartFile("coverImage", "x.pdf", "application/pdf", PNG);
        assertThatThrownBy(() -> fileStorageService.storeCoverImage(pdf))
                .hasMessageContaining("must be an image");
    }
}

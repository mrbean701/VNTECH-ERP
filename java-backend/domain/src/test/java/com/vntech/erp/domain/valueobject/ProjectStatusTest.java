package com.vntech.erp.domain.valueobject;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit test thuần domain — không cần Spring, không cần DB.
 * Ví dụ: hành vi value object ProjectStatus khớp chuỗi status của bản JS.
 */
class ProjectStatusTest {

    @Test
    void fromCode_recognizesCanonicalCodes() {
        assertEquals(ProjectStatus.ACTIVE, ProjectStatus.fromCode("active"));
        assertEquals(ProjectStatus.INACTIVE, ProjectStatus.fromCode("inactive"));
        assertEquals(ProjectStatus.COMPLETED, ProjectStatus.fromCode("completed"));
        assertEquals(ProjectStatus.ARCHIVED, ProjectStatus.fromCode("archived"));
    }

    @Test
    void fromCode_acceptsUppercase_matchingJsCaseInsensitiveBehavior() {
        assertEquals(ProjectStatus.ACTIVE, ProjectStatus.fromCode("ACTIVE"));
    }

    @Test
    void fromCode_fallsBackToActive_whenUnknown_likeJsDefault() {
        assertEquals(ProjectStatus.ACTIVE, ProjectStatus.fromCode("whatever"));
        assertEquals(ProjectStatus.ACTIVE, ProjectStatus.fromCode(null));
    }

    @Test
    void code_returnsCanonicalString() {
        assertEquals("active", ProjectStatus.ACTIVE.code());
        assertEquals("archived", ProjectStatus.ARCHIVED.code());
    }

    @Test
    void changeStatus_rejectsNull_andBumpsUpdatedAt() {
        var project = new com.vntech.erp.domain.entity.Project(
                "p_1", "PRJ-01", "Dự án mẫu", ProjectStatus.ACTIVE,
                null, null, null, null, null,
                java.time.Instant.parse("2026-01-01T00:00:00Z"),
                java.time.Instant.parse("2026-01-01T00:00:00Z"));
        assertThrows(NullPointerException.class, () -> project.changeStatus(null));
        var before = project.updatedAt();
        project.changeStatus(ProjectStatus.COMPLETED);
        assertEquals(ProjectStatus.COMPLETED, project.status());
        org.junit.jupiter.api.Assertions.assertTrue(project.updatedAt().isAfter(before));
    }
}
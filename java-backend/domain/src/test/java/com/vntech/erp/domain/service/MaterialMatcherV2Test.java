package com.vntech.erp.domain.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit test MaterialMatcherV2 — kiểm chứng port Java khớp hành vi lib/material-matching-v2.mjs.
 */
class MaterialMatcherV2Test {

    @Test
    void normalizeMaterialText_handlesTechnicalNotation() {
        // Kiểm chứng trực tiếp với lib/material-matching-v2.mjs (node): Phi 20 -> d20, DN25 -> dn25
        assertEquals("d20", MaterialMatcherV2.normalizeMaterialText("Phi 20"));
        assertEquals("dn25", MaterialMatcherV2.normalizeMaterialText("DN25"));
        assertEquals("ong d20", MaterialMatcherV2.normalizeMaterialText("Ống Phi 20"));
    }

    @Test
    void cosineSimilarity_identityVectors() {
        double[] a = MaterialMatcherV2.localFeatureEmbedding("ống thép Phi 20", MaterialMatcherV2.DIM);
        double[] b = MaterialMatcherV2.localFeatureEmbedding("ống thép Phi 20", MaterialMatcherV2.DIM);
        assertEquals(1.0, MaterialMatcherV2.cosineSimilarity(a, b), 1e-9);
    }

    @Test
    void tokenSimilarity_regular() {
        assertEquals(1.0, MaterialMatcherV2.tokenSimilarity("ống thép", "ống thép"));
        assertTrue(MaterialMatcherV2.tokenSimilarity("ống thép DN20", "ống thép DN20") > 0.9);
    }

    @Test
    void embedding_dimension96() {
        assertEquals(96, MaterialMatcherV2.localFeatureEmbedding("test", MaterialMatcherV2.DIM).length);
    }

    @Test
    void gate_exactAlwaysPasses() {
        Map<String, Object> source = Map.of("contractMaterialName", "ống thép tráng kẽm DN20");
        Map<String, Object> candidate = Map.of("name", "ống thép tráng kẽm DN20");
        var gate = MaterialMatcherV2.materialCandidateGate(source, candidate, null, null);
        assertTrue(gate.accepted());
        assertEquals("exact", gate.reason());
    }

    @Test
    void gate_systemConflictRejected() {
        Map<String, Object> source = Map.of("contractMaterialName", "cáp điện 3x2.5", "systemCode", "DIEN");
        Map<String, Object> candidate = Map.of("name", "ống nhựa PPR DN20", "system", "CTN");
        var gate = MaterialMatcherV2.materialCandidateGate(source, candidate, null, null);
        org.junit.jupiter.api.Assertions.assertFalse(gate.accepted());
    }

    @Test
    void scoring_exactNameAndUomScoresOne() {
        Map<String, Object> source = Map.of("contractMaterialName", "van bi DN50", "unit", "cái", "systemCode", "CTN");
        Map<String, Object> material = Map.of("id", "m1", "code", "V001", "name", "van bi DN50", "unit", "cái",
                "system", "CTN");
        var score = MaterialMatcherV2.scoreMaterialCandidate(source, material,
                "van bi DN50", "van bi DN50", 0,
                MaterialMatcherV2.localFeatureEmbedding("van bi DN50", MaterialMatcherV2.DIM),
                MaterialMatcherV2.localFeatureEmbedding("van bi DN50", MaterialMatcherV2.DIM),
                "local_feature_v1", false);
        assertEquals(1.0, score.finalScore(), 1e-9);
        assertEquals("exact", score.status());
    }

    @Test
    void familyMatch_pprAccepted() {
        Map<String, Object> source = Map.of("contractMaterialName", "ống nhựa PPR DN25");
        Map<String, Object> candidate = Map.of("name", "PPR ống DN25");
        var gate = MaterialMatcherV2.materialCandidateGate(source, candidate, null, null);
        assertTrue(gate.accepted(), "PPR family match phải pass gate");
        assertTrue(gate.reason().contains("family"));
    }

    @Test
    void scoring_reviewBelowThreshold() {
        Map<String, Object> source = Map.of("contractMaterialName", "van bi inox 1 chiều DN50", "unit", "cái",
                "systemCode", "CTN");
        Map<String, Object> material = Map.of("id", "m1", "code", "V001", "name", "van bi gang", "unit", "cái",
                "system", "CTN");
        var score = MaterialMatcherV2.scoreMaterialCandidate(source, material,
                "van bi inox 1 chiều DN50", "van bi gang", 0,
                MaterialMatcherV2.localFeatureEmbedding("van bi inox 1 chiều DN50", MaterialMatcherV2.DIM),
                MaterialMatcherV2.localFeatureEmbedding("van bi gang", MaterialMatcherV2.DIM),
                "local_feature_v1", false);
        assertTrue(score.finalScore() < 1.0);
    }
}
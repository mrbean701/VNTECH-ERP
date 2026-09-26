package com.vntech.erp.domain.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * VNTECH Material Matching Engine V2 — port NGUYÊN TRẠNG từ lib/material-matching-v2.mjs (monolith JS).
 * Thuần Java, deterministic: embedding 96 chiều (FNV-1a hashing trick + tri-gram), 6 tiêu chí điểm,
 * candidate gate bảo thủ (exact luôn pass; hard technical conflict fail; cần shared family/object/DN…).
 */
public final class MaterialMatcherV2 {

    public static final int DIM = 96;
    public static final Map<String, Number> THRESHOLDS = Map.of("exact", 1, "veryHigh", .95, "high", .90, "review", .80);
    public static final Map<String, Number> WEIGHTS = Map.of(
            "history", .10, "technical", .30, "system", .10, "uom", .15, "fuzzy", .20, "embedding", .15);

    private MaterialMatcherV2() { }

    // ---------- text ----------
    public static String normalizeMaterialText(String value) {
        String s = String.valueOf(value == null ? "" : value)
                .replace("²", "2").replace("³", "3");
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .replaceAll("đ", "d").replaceAll("Đ", "D").toLowerCase()
                .replace("ø", " d ")
                .replaceAll("\\bphi\\s*(\\d+(?:[.,]\\d+)?)", " d$1 ")
                .replaceAll("\\bdn\\s*(\\d+(?:[.,]\\d+)?)", " dn$1 ")
                .replaceAll("\\bmm\\s*2\\b", "mm2")
                .replaceAll("\\s+", " ")
                .replaceAll("[^a-z0-9+./-]+", " ")
                .replaceAll("\\s+", " ").trim();
        return s;
    }

    static long hashToken(String token) {
        long h = 2166136261L; // unsigned 32-bit FNV offset basis
        for (int i = 0; i < token.length(); i++) {
            h ^= token.charAt(i);
            h = (h * 16777619L) & 0xFFFFFFFFL;
        }
        return h;
    }

    /** localFeatureEmbedding — hash trick 96 chiều với tri-gram variants + 1.4 cho token nguyên. */
    public static double[] localFeatureEmbedding(String value, int dim) {
        String text = normalizeMaterialText(value);
        double[] out = new double[dim];
        String[] tokens = text.split("\\s+");
        for (String token : tokens) {
            if (token.isEmpty()) continue;
            List<String> variants = new ArrayList<>();
            variants.add(token);
            if (token.length() > 3) {
                for (int i = 0; i <= token.length() - 3; i++) variants.add(token.substring(i, i + 3));
            }
            for (String v : variants) {
                long h = hashToken(v);
                int idx = (int) (h % dim);
                int sign = (h & 1) == 1 ? 1 : -1;
                out[idx] += sign * (v.equals(token) ? 1.4 : .35);
            }
        }
        double norm = 0;
        for (double x : out) norm += x * x;
        norm = Math.sqrt(norm);
        if (norm == 0) norm = 1;
        for (int i = 0; i < out.length; i++) out[i] /= norm;
        return out;
    }

    public static double cosineSimilarity(double[] a, double[] b) {
        if (a == null || b == null || a.length == 0 || a.length != b.length) return 0;
        double dot = 0, aa = 0, bb = 0;
        for (int i = 0; i < a.length; i++) {
            double x = a[i] == 0 ? 0 : a[i], y = b[i] == 0 ? 0 : b[i];
            dot += x * y; aa += x * x; bb += y * y;
        }
        if (aa == 0 || bb == 0) return 0;
        return Math.max(-1, Math.min(1, dot / (Math.sqrt(aa) * Math.sqrt(bb))));
    }

    public static double tokenSimilarity(String a, String b) {
        Set<String> A = new LinkedHashSet<>(List.of(normalizeMaterialText(a).split("\\s+")));
        Set<String> B = new LinkedHashSet<>(List.of(normalizeMaterialText(b).split("\\s+")));
        A.remove(""); B.remove("");
        if (A.isEmpty() || B.isEmpty()) return 0;
        int hit = 0;
        for (String x : A) if (B.contains(x)) hit++;
        return (2.0 * hit) / (A.size() + B.size());
    }

    // ---------- technical comparison ----------
    private static final List<String> CRITICAL = List.of("dn", "diameter", "pn", "ka", "voltage", "current", "sch", "poles");

    static Map<String, Object> parseTechnical(String value) {
        String s = normalizeMaterialText(value);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("dn", pick(s, "\\bdn\\s*(\\d+(?:[.,]\\d+)?)"));
        String diameter = String.valueOf(out.get("dn"));
        if (diameter.isEmpty() || diameter.equals("null")) diameter = pick(s, "\\bd\\s*(\\d+(?:[.,]\\d+)?)");
        out.put("diameter", diameter.isEmpty() || diameter.equals("null") ? "" : diameter);
        out.put("pn", pick(s, "\\bpn\\s*(\\d+(?:[.,]\\d+)?)"));
        out.put("ka", pick(s, "\\b(\\d+(?:[.,]\\d+)?)\\s*ka\\b"));
        out.put("voltage", pick(s, "\\b(\\d+(?:[.,]\\d+)?)\\s*(?:v|kv)\\b"));
        out.put("current", pick(s, "\\b(\\d+(?:[.,]\\d+)?)\\s*a\\b"));
        out.put("sch", pick(s, "\\bsch\\s*(\\d+(?:[.,]\\d+)?)"));
        out.put("thickness", pick(s, "\\b(?:d(?:ay)?|thickness)\\s*(\\d+(?:[.,]\\d+)?)\\s*mm\\b"));
        Set<String> sections = new LinkedHashSet<>();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                "\\b(\\d+(?:[.,]\\d+)?\\s*x\\s*\\d+(?:[.,]\\d+)?(?:\\s*\\+\\s*e?\\s*\\d+(?:[.,]\\d+)?)?)\\s*(?:mm2)?\\b")
                .matcher(s);
        while (m.find()) sections.add(m.group(1).replaceAll("\\s+", ""));
        out.put("sections", new ArrayList<>(sections));
        Set<String> areas = new LinkedHashSet<>();
        m = java.util.regex.Pattern.compile("\\b(\\d+(?:[.,]\\d+)?)\\s*mm2\\b").matcher(s);
        while (m.find()) areas.add(String.valueOf((long) Double.parseDouble(m.group(1).replace(',', '.'))));
        out.put("areas", new ArrayList<>(areas));
        out.put("poles", pick(s, "\\b([1-4])\\s*p\\b"));
        String material = List.of("upvc", "pvc", "ppr", "hdpe", "gi", "inox", "steel", "thep", "cu", "copper", "xlpe")
                .stream().filter(s::contains).findFirst().orElse("");
        out.put("material", material);
        return out;
    }

    private static String pick(String s, String regex) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(regex).matcher(s);
        return m.find() ? m.group(1).replace(',', '.') : "";
    }

    public record TechnicalResult(double score, List<String> conflicts, Map<String, Object> source, Map<String, Object> candidate) {
        public boolean hardConflict() { return !conflicts.isEmpty(); }
    }

    public static TechnicalResult technicalComparison(String source, String candidate) {
        Map<String, Object> a = parseTechnical(source), b = parseTechnical(candidate);
        List<String> conflicts = new ArrayList<>();
        int compared = 0, matched = 0;
        for (String k : CRITICAL) {
            Object av = a.get(k), bv = b.get(k);
            String as = av == null ? "" : String.valueOf(av), bs = bv == null ? "" : String.valueOf(bv);
            if (!as.isEmpty() && !bs.isEmpty()) {
                compared++;
                if (as.equals(bs)) matched++;
                else conflicts.add(k + ":" + as + "!=" + bs);
            }
        }
        @SuppressWarnings("unchecked")
        List<String> asec = (List<String>) a.getOrDefault("sections", List.of());
        @SuppressWarnings("unchecked")
        List<String> bsec = (List<String>) b.getOrDefault("sections", List.of());
        if (!asec.isEmpty() && !bsec.isEmpty()) {
            compared++;
            if (String.join("|", asec).equals(String.join("|", bsec))) matched++;
            else conflicts.add("section:" + String.join("|", asec) + "!=" + String.join("|", bsec));
        }
        @SuppressWarnings("unchecked")
        List<String> aar = (List<String>) a.getOrDefault("areas", List.of());
        @SuppressWarnings("unchecked")
        List<String> bar = (List<String>) b.getOrDefault("areas", List.of());
        if (!aar.isEmpty() && !bar.isEmpty()) {
            compared++;
            if (String.join("|", aar).equals(String.join("|", bar))) matched++;
            else conflicts.add("area:" + String.join("|", aar) + "!=" + String.join("|", bar));
        }
        if (!String.valueOf(a.getOrDefault("material", "")).isEmpty()
                && !String.valueOf(b.getOrDefault("material", "")).isEmpty()) {
            compared++;
            if (String.valueOf(a.get("material")).equals(String.valueOf(b.get("material")))) matched++;
        }
        return new TechnicalResult(compared > 0 ? (double) matched / compared : .5, conflicts, a, b);
    }

    // ---------- candidate gate ----------
    private static final Set<String> CANDIDATE_STOPWORDS = Set.of("vat", "tu", "thiet", "bi", "phu", "kien", "loai",
            "bo", "cai", "chiec", "hang", "hoa", "theo", "cho", "va", "voi", "tai", "trong", "ngoai", "he", "thong",
            "cong", "trinh", "ky", "thuat", "shopdrawing");

    public record GateResult(boolean accepted, String reason, TechnicalResult technical) { }

    public static GateResult materialCandidateGate(Map<String, Object> source, Map<String, Object> candidate,
                                                   String sourceText, String candidateText) {
        String left = (sourceText == null || sourceText.isBlank())
                ? joinText(source.get("contractMaterialName"), source.get("materialName"), source.get("description"), source.get("specification"))
                : sourceText;
        String right = (candidateText == null || candidateText.isBlank())
                ? joinText(candidate.get("name"), candidate.get("specification"), candidate.get("brand"))
                : candidateText;
        String normalizedLeft = normalizeMaterialText(left), normalizedRight = normalizeMaterialText(right);
        if (normalizedLeft.isEmpty() || normalizedRight.isEmpty()) return new GateResult(false, "empty_text", null);
        if (normalizedLeft.equals(normalizedRight)) return new GateResult(true, "exact", null);
        TechnicalResult tech = technicalComparison(left, right);
        if (tech.hardConflict()) return new GateResult(false, "hard_technical_conflict", tech);
        String sourceSystem = canonicalSystem(str(source.get("systemCode"), source.get("sourceSystemCode")));
        String candidateSystem = canonicalSystem(str(candidate.get("system"), candidate.get("systemCode")));
        if (!sourceSystem.isEmpty() && !candidateSystem.isEmpty() && !"KHAC".equals(sourceSystem)
                && !"KHAC".equals(candidateSystem) && !sourceSystem.equals(candidateSystem))
            return new GateResult(false, "system_conflict", tech);
        Set<String> sourceObjects = objectClassSet(left), candidateObjects = objectClassSet(right);
        if (!sourceObjects.isEmpty() && !candidateObjects.isEmpty() && !intersects(sourceObjects, candidateObjects))
            return new GateResult(false, "object_class_conflict", tech);
        Set<String> lf = familySet(left), rf = familySet(right);
        if (!lf.isEmpty() && !rf.isEmpty() && !intersects(lf, rf))
            return new GateResult(false, "material_family_conflict", tech);
        double fuzzy = tokenSimilarity(left, right);
        if (lf.contains("dsta") && !rf.contains("dsta"))
            return new GateResult(false, "required_family_modifier_missing", tech);
        if (!lf.isEmpty() && !intersects(lf, rf))
            return new GateResult(false, "material_family_missing", tech);
        Set<String> ls = significantTokens(left), rs = significantTokens(right);
        List<String> shared = new ArrayList<>();
        for (String t : ls) if (rs.contains(t)) shared.add(t);
        boolean objectShared = shared.stream().anyMatch(OBJECT_TOKENS::contains);
        String aDn = str(tech.source().get("dn"), tech.source().get("diameter"));
        String bDn = str(tech.candidate().get("dn"), tech.candidate().get("diameter"));
        boolean sameDn = !aDn.isEmpty() && !bDn.isEmpty() && aDn.equals(bDn);
        @SuppressWarnings("unchecked")
        List<String> aSections = (List<String>) tech.source().getOrDefault("sections", List.of());
        @SuppressWarnings("unchecked")
        List<String> bSections = (List<String>) tech.candidate().getOrDefault("sections", List.of());
        boolean sameSection = !aSections.isEmpty() && !bSections.isEmpty() && aSections.stream().anyMatch(bSections::contains);
        @SuppressWarnings("unchecked")
        List<String> aAreas = (List<String>) tech.source().getOrDefault("areas", List.of());
        @SuppressWarnings("unchecked")
        List<String> bAreas = (List<String>) tech.candidate().getOrDefault("areas", List.of());
        boolean sameArea = !aAreas.isEmpty() && !bAreas.isEmpty() && aAreas.stream().anyMatch(bAreas::contains);
        boolean familyShared = intersects(lf, rf);
        long meaningfulShared = shared.stream()
                .filter(t -> t.length() >= 3 && !List.of("dong", "thep", "nhua").contains(t)).count();
        if (!sourceObjects.isEmpty() && candidateObjects.isEmpty() && !familyShared && !sameDn && !sameSection && !sameArea)
            return new GateResult(false, "object_class_missing", tech);
        if (familyShared && (objectShared || sameDn || sameSection || sameArea || fuzzy >= 0.24))
            return new GateResult(true, "family_match", tech);
        if ((sameDn || sameSection || sameArea) && objectShared)
            return new GateResult(true, "technical_object_match", tech);
        if (objectShared && meaningfulShared >= 1 && fuzzy >= 0.30)
            return new GateResult(true, "object_name_match", tech);
        if (meaningfulShared >= 2 && fuzzy >= 0.40)
            return new GateResult(true, "lexical_match", tech);
        if (fuzzy >= 0.62) return new GateResult(true, "strong_lexical_match", tech);
        return new GateResult(false, "insufficient_similarity", tech);
    }

    // ---------- score ----------
    public record CandidateScore(String materialId, String materialCode, String standardMaterialName, String unit,
                                 String system, String specification, String brand,
                                 double historyScore, double technicalScore, double systemScore, double uomScore,
                                 double fuzzyScore, double embeddingScore, double finalScore, boolean exactMatch,
                                 boolean hardConflict, String conflictReason, String provider, boolean providerFallback,
                                 String status) { }

    public static CandidateScore scoreMaterialCandidate(Map<String, Object> source, Map<String, Object> material,
                                                        String sourceText, String candidateText, double historyCount,
                                                        double[] sourceEmbedding, double[] candidateEmbedding,
                                                        String provider, boolean providerFallback) {
        TechnicalResult tech = technicalComparison(sourceText, candidateText);
        double fuzzy = tokenSimilarity(sourceText, candidateText);
        double embedding = Math.max(0, cosineSimilarity(sourceEmbedding, candidateEmbedding));
        String srcSystem = normalizeMaterialText(str(source.get("systemCode"), null));
        String matSystem = normalizeMaterialText(str(material.get("system"), null));
        double systemScore = (source.get("systemCode") != null && material.get("system") != null)
                ? (srcSystem.equals(matSystem) ? 1 : 0) : .5;
        String srcUnit = String.valueOf(source.get("unit") == null ? "" : source.get("unit"));
        String matUnit = String.valueOf(material.get("unit") == null ? "" : material.get("unit"));
        double rawUomScore = (!srcUnit.isEmpty() && !matUnit.isEmpty())
                ? (normalizeMaterialText(srcUnit).equals(normalizeMaterialText(matUnit)) ? 1 : 0) : .5;
        double historyScore = historyCount > 0 ? Math.min(1, .75 + .05 * historyCount) : 0;
        String sourceName = str(source.get("contractMaterialName"), source.get("materialName"));
        String matName = str(material.get("name"), null);
        boolean exactName = !normalizeMaterialText(sourceName).isEmpty()
                && normalizeMaterialText(sourceName).equals(normalizeMaterialText(matName));
        boolean exactUom = srcUnit.isEmpty() || matUnit.isEmpty()
                || normalizeMaterialText(srcUnit).equals(normalizeMaterialText(matUnit));
        boolean exact = exactName && exactUom && !tech.hardConflict();
        double technicalScore = exact ? 1 : tech.score();
        double uomScore = exactUom ? 1 : rawUomScore;
        double fuzzyScore = exactName ? 1 : fuzzy;
        double embeddingScore = exactName ? 1 : embedding;
        double finalScore = finalMatchScore(historyScore, technicalScore, systemScore, uomScore, fuzzyScore,
                embeddingScore, tech.hardConflict(), exact);
        return new CandidateScore(str(material.get("id"), null), str(material.get("code"), null),
                str(material.get("name"), null), str(material.get("unit"), null), str(material.get("system"), null),
                str(material.get("specification"), null), str(material.get("brand"), null),
                historyScore, technicalScore, systemScore, uomScore, fuzzyScore, embeddingScore, finalScore, exact,
                tech.hardConflict(), String.join("; ", tech.conflicts()), provider, providerFallback,
                matchStatus(finalScore, tech.hardConflict()));
    }

    static double finalMatchScore(double history, double technical, double system, double uom, double fuzzy,
                                  double embedding, boolean hardConflict, boolean exact) {
        if (exact && !hardConflict) return 1;
        Map<String, Number> w = WEIGHTS;
        double score = w.get("history").doubleValue() * clamp01(history)
                + w.get("technical").doubleValue() * clamp01(technical)
                + w.get("system").doubleValue() * clamp01(system)
                + w.get("uom").doubleValue() * clamp01(uom)
                + w.get("fuzzy").doubleValue() * clamp01(fuzzy)
                + w.get("embedding").doubleValue() * clamp01(embedding);
        return hardConflict ? Math.min(score, .74) : score;
    }

    static String matchStatus(double score, boolean hardConflict) {
        if (hardConflict) return "conflict";
        double p = score * 100;
        if (p >= 99.999) return "exact";
        if (p >= 95) return "very_high";
        if (p >= 90) return "high";
        if (p >= 80) return "review";
        return "not_found";
    }

    // ---------- helpers ----------
    private static double clamp01(double x) { return Math.max(0, Math.min(1, Double.isNaN(x) ? 0 : x)); }

    private static Set<String> tokenSet(String value) {
        Set<String> out = new LinkedHashSet<>(List.of(normalizeMaterialText(value).split("\\s+")));
        out.remove("");
        return out;
    }

    private static boolean intersects(Set<String> a, Set<String> b) {
        for (String item : a) if (b.contains(item)) return true;
        return false;
    }

    private static String canonicalSystem(String value) {
        String raw = normalizeMaterialText(value).replaceAll("[^a-z0-9]", "");
        if (List.of("dien", "electrical").contains(raw)) return "DIEN";
        if (List.of("ctn", "nuoc", "capthoatnuoc", "plumbing").contains(raw)) return "CTN";
        if (List.of("hvac", "dieuhoathonggio").contains(raw)) return "HVAC";
        if (List.of("elv", "dnhe", "diennhe").contains(raw)) return "DNHE";
        if (List.of("pccc", "fire").contains(raw)) return "PCCC";
        if (List.of("khac", "other").contains(raw)) return "KHAC";
        return raw.toUpperCase();
    }

    private static final Set<String> KNOWN_FAMILIES = Set.of(
            "ppr", "upvc", "pvc", "hdpe", "cxv", "dsta", "xlpe",
            "cat6", "rj45", "sprinkler", "pccc", "inox");

    private static Set<String> familySet(String value) {
        String text = normalizeMaterialText(value);
        Set<String> out = new LinkedHashSet<>();
        String lower = text.toLowerCase();
        // port: regex family patterns — dùng contains đơn giản đủ chính xác theo text chuẩn hóa
        if (containsWord(lower, "ppr")) out.add("ppr");
        if (containsWord(lower, "upvc")) out.add("upvc");
        if (containsWord(lower, "pvc")) out.add("pvc");
        if (containsWord(lower, "hdpe")) out.add("hdpe");
        if (lower.contains("cxv")) out.add("cxv");
        if (containsWord(lower, "dsta")) out.add("dsta");
        if (containsWord(lower, "xlpe")) out.add("xlpe");
        if (lower.contains("cat6") || lower.contains("cat 6")) out.add("cat6");
        if (lower.contains("rj45") || lower.contains("rj 45")) out.add("rj45");
        if (containsWord(lower, "sprinkler")) out.add("sprinkler");
        if (containsWord(lower, "pccc")) out.add("pccc");
        if (containsWord(lower, "inox")) out.add("inox");
        return out;
    }

    private static boolean containsWord(String text, String word) {
        return text.matches("(?s).*\\b" + java.util.regex.Pattern.quote(word) + "\\b.*")
                || text.contains(word);
    }

    private static final Set<String> OBJECT_TOKENS = Set.of("ong", "cap", "day", "van", "bom", "quat", "mang", "thang",
            "tu", "hop", "aptomat", "mccb", "mcb", "rcbo", "rcd", "o", "cam", "co", "te", "bau", "bich", "dau", "noi",
            "loc", "dong", "ho", "den", "camera", "loa", "sprinkler", "bang", "thep", "nhua", "luoi", "ruot");

    private static final Map<String, Set<String>> OBJECT_CLASSES = Map.ofEntries(
            Map.entry("pipe", Set.of("ong")), Map.entry("cable", Set.of("cap", "day")),
            Map.entry("valve", Set.of("van")), Map.entry("pump", Set.of("bom")),
            Map.entry("fan", Set.of("quat")), Map.entry("tray", Set.of("mang", "thang")),
            Map.entry("cabinet", Set.of("tu")), Map.entry("box", Set.of("hop")),
            Map.entry("breaker", Set.of("aptomat", "mccb", "mcb", "rcbo", "rcd")),
            Map.entry("socket", Set.of("o", "cam")), Map.entry("fitting", Set.of("co", "te", "bau", "bich", "dau", "noi")),
            Map.entry("filter", Set.of("loc")), Map.entry("meter", Set.of("dong", "ho")),
            Map.entry("light", Set.of("den")), Map.entry("camera", Set.of("camera")),
            Map.entry("speaker", Set.of("loa")), Map.entry("sprinkler", Set.of("sprinkler")),
            Map.entry("bar", Set.of("bang")), Map.entry("mesh", Set.of("luoi")));

    private static Set<String> objectClassSet(String value) {
        Set<String> tokens = tokenSet(value);
        Set<String> out = new LinkedHashSet<>();
        for (Map.Entry<String, Set<String>> e : OBJECT_CLASSES.entrySet())
            if (intersects(tokens, e.getValue())) out.add(e.getKey());
        return out;
    }

    private static Set<String> significantTokens(String value) {
        Set<String> out = new LinkedHashSet<>();
        for (String t : tokenSet(value)) {
            if (t.length() > 1 && !CANDIDATE_STOPWORDS.contains(t) && !t.matches("^[0-9.]+$")) out.add(t);
        }
        return out;
    }

    private static String joinText(Object... parts) {
        StringBuilder sb = new StringBuilder();
        for (Object p : parts) {
            String s = String.valueOf(p == null ? "" : p);
            if (!s.isBlank()) { if (sb.length() > 0) sb.append(" | "); sb.append(s); }
        }
        return sb.toString();
    }

    private static String str(Object a, Object b) {
        String s = String.valueOf(a == null ? "" : a);
        if (s.isEmpty() && b != null) s = String.valueOf(b);
        return s;
    }
}
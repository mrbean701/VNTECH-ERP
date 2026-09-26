# VNTECH ERP V5.3.0 FULL W2 - deterministic Universal Central Server image
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN set -eu; \
    attempt=1; \
    while [ "$attempt" -le 3 ]; do \
      echo "[VNTECH] npm ci build dependencies - attempt $attempt/3"; \
      if npm ci --include=optional --foreground-scripts --no-audit --no-fund; then break; else code=$?; fi; \
      if [ "$attempt" -ge 3 ]; then exit "$code"; fi; \
      rm -rf node_modules; \
      sleep $((attempt * 3)); \
      attempt=$((attempt + 1)); \
    done
COPY . .
RUN node scripts/ensure-linux-native-build-deps.mjs
RUN npm run test:release-static
RUN npm run build
RUN npm run validate:built-artifact
RUN node scripts/verify-built-ui-contract.mjs
RUN node --test tests/rendered-html.test.mjs

FROM node:22-bookworm-slim AS runtime
LABEL org.opencontainers.image.title="VNTECH ERP" \
      org.opencontainers.image.version="5.3.0" \
      org.opencontainers.image.revision="5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908" \
      vntech.package.id="VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1" \
      vntech.ui.contract="VNTECH-UI-V5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908" \
      vntech.product.id="VNTECH-KHO-MEP-001" \
      vntech.trust.mode="development" \
      vntech.license.enforcement="disabled-by-design"
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8787 \
    VNTECH_DB_ENGINE=postgres \
    VNTECH_RELEASE_VERSION=5.3.0 \
    VNTECH_RELEASE_BUILD=5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908 \
    VNTECH_PACKAGE_ID=VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1 \
    VNTECH_UI_CONTRACT_ID=VNTECH-UI-V5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908 \
    VNTECH_TRUST_MODE=development \
    VNTECH_LICENSE_ENFORCEMENT=0
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --foreground-scripts --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/lib ./lib
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/public ./public
COPY --from=build /app/native-verifier ./native-verifier
COPY --from=build /app/VNTECH_FINGERPRINT.json ./VNTECH_FINGERPRINT.json
COPY --from=build /app/VNTECH_PRODUCT_IDENTITY.txt ./VNTECH_PRODUCT_IDENTITY.txt
COPY --from=build /app/VNTECH_PACKAGE_ID.txt ./VNTECH_PACKAGE_ID.txt
COPY --from=build /app/VNTECH_FULL_W2_ID.txt ./VNTECH_FULL_W2_ID.txt
COPY --from=build /app/deploy/docker-entrypoint.sh ./deploy/docker-entrypoint.sh
RUN chmod +x ./deploy/docker-entrypoint.sh
RUN test "$(cat ./dist/.mep-version)" = "5.3.0" && node scripts/preflight-runtime-image.mjs
EXPOSE 8787
ENTRYPOINT ["./deploy/docker-entrypoint.sh"]

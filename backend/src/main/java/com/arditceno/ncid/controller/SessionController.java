/*
 * NCID Backend - Copyright (c) 2026 Ardit Ceno. All rights reserved.
 * Proprietary software; see the LICENSE file at the repository root.
 */
package com.arditceno.ncid.controller;

import com.arditceno.ncid.repository.SessionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SessionController {

    private final SessionRepository repo;
    private final ObjectMapper mapper;

    @Value("${ncid.admin-token:}")
    private String adminToken;

    public SessionController(SessionRepository repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    /** Participants POST their anonymous session here. */
    @PostMapping("/sessions")
    public ResponseEntity<?> create(@RequestBody JsonNode body) {
        JsonNode summary = body.has("summary") ? body.get("summary") : body;
        String id = extractId(summary, body);
        if (!StringUtils.hasText(id)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "missing participant id (participant.id_anonim)"));
        }
        try {
            String payload = mapper.writeValueAsString(summary);
            UUID id0 = repo.insert(id, payload);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("ok", true, "id", id0.toString()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/sessions/batch")
    public ResponseEntity<?> createBatch(@RequestBody List<JsonNode> batch,
                                         @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!authorized(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        int saved = 0;
        for (JsonNode body : batch) {
            try {
                JsonNode summary = body.has("summary") ? body.get("summary") : body;
                String id = extractId(summary, body);
                if (StringUtils.hasText(id)) {
                    repo.insert(id, mapper.writeValueAsString(summary));
                    saved++;
                }
            } catch (Exception ignored) {
                // keep going; report how many were stored
            }
        }
        return ResponseEntity.ok(Map.of("saved", saved, "total", batch.size()));
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> list(@RequestParam(defaultValue = "100") int limit,
                                  @RequestParam(defaultValue = "0") int offset,
                                  @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!authorized(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        int safeLimit = Math.min(Math.max(limit, 1), 1000);
        return ResponseEntity.ok(repo.list(safeLimit, Math.max(offset, 0)));
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<?> get(@PathVariable UUID id,
                                 @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!authorized(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<Map<String, Object>> row = repo.find(id);
        return row.<ResponseEntity<?>>map(ResponseEntity::ok)
                  .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id,
                                    @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!authorized(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(Map.of("deleted", repo.delete(id)));
    }

    /** Session-quality dashboard data. */
    @GetMapping("/stats")
    public ResponseEntity<?> stats(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!authorized(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(repo.stats());
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "up"));
    }

    private String extractId(JsonNode summary, JsonNode body) {
        JsonNode participant = summary.path("participant");
        if (participant.hasNonNull("id_anonim")) return participant.get("id_anonim").asText();
        if (summary.hasNonNull("id_anonim")) return summary.get("id_anonim").asText();
        if (body.hasNonNull("id_anonim")) return body.get("id_anonim").asText();
        return null;
    }

    private boolean authorized(String token) {
        if (!StringUtils.hasText(adminToken)) return true; // dev mode: no token configured
        return adminToken.equals(token);
    }
}

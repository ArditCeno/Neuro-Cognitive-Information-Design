/*
 * NCID Backend - Copyright (c) 2025 Ardit Ceno. All rights reserved.
 * Proprietary software; see the LICENSE file at the repository root.
 */
package com.arditceno.ncid.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
public class SessionRepository {

    private final JdbcTemplate jdbc;

    public SessionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public UUID insert(String idAnonim, String payloadJson) {
        return jdbc.queryForObject(
                "insert into sessions(id_anonim, payload) values (?, ?::jsonb) returning id",
                UUID.class, idAnonim, payloadJson);
    }

    public List<Map<String, Object>> list(int limit, int offset) {
        return jdbc.queryForList(
                "select id, id_anonim, payload::text as payload, created_at " +
                "from sessions order by created_at desc limit ? offset ?",
                limit, offset);
    }

    public Optional<Map<String, Object>> find(UUID id) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "select id, id_anonim, payload::text as payload, created_at from sessions where id = ?",
                id);
        return rows.stream().findFirst();
    }

    public Map<String, Object> stats() {
        return jdbc.queryForMap(
                "select count(*) as total_sessions, " +
                "       count(distinct id_anonim) as participants, " +
                "       min(created_at) as first_session, " +
                "       max(created_at) as last_session " +
                "from sessions");
    }

    public int delete(UUID id) {
        return jdbc.update("delete from sessions where id = ?", id);
    }
}

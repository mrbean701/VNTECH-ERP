package com.vntech.erp.application.notification;

import com.vntech.erp.application.port.out.NotificationStore;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * MT2 §15.1 — **RECIPIENT RESOLVER**: giải người nhận từ {@code recipient_mode}
 * ({@code all | user | users | department | project}) ra danh sách {@code user_id} đã khử trùng.
 *
 * <p>⛔ Không bịa người nhận: mode/loại đích chưa hỗ trợ bị bỏ qua, người nhận rỗng nghĩa là
 * không phát thông báo (caller tự bỏ qua).
 */
public final class NotificationRecipientResolver {

    private final NotificationStore store;

    public NotificationRecipientResolver(NotificationStore store) {
        this.store = store;
    }

    public List<String> resolve(Map<String, Object> config) {
        String mode = value(config == null ? null : config.get("recipientMode"));
        Set<String> users = new LinkedHashSet<>();
        if ("all".equals(mode)) {
            users.addAll(store.activeUserIds());
        } else {
            // `user` (một) và `users` (nhiều) đều lưu ở bảng đích polymorphic với `targetType='user'`.
            for (Map<String, Object> target : store.configTargets(value(config.get("id")))) {
                String type = value(target.get("targetType"));
                String targetId = value(target.get("targetId"));
                if (targetId.isEmpty()) continue;
                switch (type) {
                    case "user" -> users.add(targetId);
                    case "department" -> users.addAll(store.userIdsByDepartment(targetId));
                    case "project" -> users.addAll(store.userIdsByProject(targetId));
                    default -> { /* ⛔ loại đích chưa hỗ trợ ⇒ bỏ qua, KHÔNG suy diễn */ }
                }
            }
        }
        return new ArrayList<>(users);
    }

    private static String value(Object raw) {
        return raw == null ? "" : String.valueOf(raw).trim();
    }
}

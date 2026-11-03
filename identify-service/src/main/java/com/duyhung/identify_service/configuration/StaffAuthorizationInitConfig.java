package com.duyhung.identify_service.configuration;

import com.duyhung.identify_service.entity.Permission;
import com.duyhung.identify_service.entity.Role;
import com.duyhung.identify_service.repository.PermissionRepository;
import com.duyhung.identify_service.repository.RoleRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashSet;
import java.util.Set;

@Configuration
public class StaffAuthorizationInitConfig {
    private static final String[][] PERMISSIONS = {
            {"MEDICINE_READ", "Xem danh sách và thông tin thuốc"},
            {"MEDICINE_CREATE", "Thêm thuốc mới"},
            {"MEDICINE_UPDATE", "Sửa thông tin thuốc"},
            {"MEDICINE_DELETE", "Xóa thuốc"},
            {"STAFF_READ", "Xem danh sách nhân viên"},
            {"STAFF_CREATE", "Tạo tài khoản nhân viên"},
            {"STAFF_UPDATE", "Sửa thông tin nhân viên"},
            {"STAFF_DELETE", "Xóa tài khoản nhân viên"}
    };

    @Bean
    @ConditionalOnProperty(prefix = "spring.datasource", name = "driverClassName", havingValue = "com.mysql.cj.jdbc.Driver")
    ApplicationRunner initializeStaffPermissions(PermissionRepository permissions, RoleRepository roles) {
        return args -> {
            Set<Permission> available = new HashSet<>();
            for (String[] item : PERMISSIONS) {
                available.add(permissions.findById(item[0]).orElseGet(() ->
                        permissions.save(Permission.builder().name(item[0]).description(item[1]).build())));
            }
            var existing = roles.findById("STAFF");
            Role staff = existing.orElseGet(() -> Role.builder()
                    .name("STAFF").description("Nhân viên").permissions(new HashSet<>()).build());
            if (staff.getPermissions() == null) staff.setPermissions(new HashSet<>());
            if (existing.isEmpty()) {
                available.stream().filter(p -> p.getName().equals("MEDICINE_READ")).forEach(staff.getPermissions()::add);
                roles.save(staff);
            }
        };
    }
}

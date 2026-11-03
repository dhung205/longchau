package com.duyhung.identify_service.service;


import com.duyhung.identify_service.dto.request.RoleRequest;
import com.duyhung.identify_service.dto.response.RoleRespone;
import com.duyhung.identify_service.mapper.RoleMapper;
import com.duyhung.identify_service.repository.PermissionRepository;
import com.duyhung.identify_service.repository.RoleRepository;
import org.springframework.http.HttpStatus;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    public RoleRespone create(RoleRequest request) {
        var role = roleMapper.torole(request);

        var permissions = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));

        role = roleRepository.save(role);
        return roleMapper.toRoleRespone(role);
    }

    public RoleRespone update(String name, RoleRequest request) {
        var role = roleRepository.findById(name)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vai trò"));
        var permissionIds = request.getPermissions() == null ? java.util.Set.<String>of() : request.getPermissions();
        var permissions = permissionRepository.findAllById(permissionIds);
        if (permissions.size() != permissionIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Có quyền không tồn tại");
        }
        role.setPermissions(new HashSet<>(permissions));
        if (request.getDescription() != null) role.setDescription(request.getDescription());
        return roleMapper.toRoleRespone(roleRepository.save(role));
    }

    public List<RoleRespone> getAll() {
        return roleRepository.findAll()
                .stream()
                .map(roleMapper::toRoleRespone)
                .toList();
    }

    public void delete(String role) {
        roleRepository.deleteById(role);
    }
}

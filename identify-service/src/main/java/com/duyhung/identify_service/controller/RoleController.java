package com.duyhung.identify_service.controller;


import com.duyhung.identify_service.dto.request.ApiResponse;
import com.duyhung.identify_service.dto.request.PermissionRequest;
import com.duyhung.identify_service.dto.request.RoleRequest;
import com.duyhung.identify_service.dto.response.PermissionRespone;
import com.duyhung.identify_service.dto.response.RoleRespone;
import com.duyhung.identify_service.service.PermissionService;
import com.duyhung.identify_service.service.RoleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/roles")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class RoleController {
    RoleService roleService;

    @PostMapping
    ApiResponse<RoleRespone> create(@RequestBody RoleRequest request) {
        return ApiResponse.<RoleRespone>builder()
                .result(roleService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<RoleRespone>> getAll() {
        return ApiResponse.<List<RoleRespone>>builder()
                .result(roleService.getAll())
                .build();
    }

    @PutMapping("/{role}")
    ApiResponse<RoleRespone> update(@PathVariable String role, @RequestBody RoleRequest request) {
        return ApiResponse.<RoleRespone>builder().result(roleService.update(role, request)).build();
    }

    @DeleteMapping("/{role}")
    ApiResponse<Void> delete(@PathVariable String role) {
        roleService.delete(role);
        return ApiResponse.<Void>builder().build();
    }
}

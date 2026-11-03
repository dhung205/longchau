package com.duyhung.identify_service.controller;

import com.duyhung.identify_service.dto.request.ApiResponse;
import com.duyhung.identify_service.dto.request.StaffAccountRequest;
import com.duyhung.identify_service.dto.response.UserResponse;
import com.duyhung.identify_service.entity.User;
import com.duyhung.identify_service.mapper.UserMapper;
import com.duyhung.identify_service.repository.RoleRepository;
import com.duyhung.identify_service.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/admin/staff")
@RequiredArgsConstructor
public class StaffAccountController {
    private final UserRepository users;
    private final RoleRepository roles;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('STAFF_READ')")
    public ApiResponse<List<UserResponse>> list() {
        var staff = users.findAll().stream()
                .filter(user -> user.getRoles() != null && user.getRoles().stream().anyMatch(role -> "STAFF".equals(role.getName())))
                .map(mapper::toUserResponse).toList();
        return ApiResponse.<List<UserResponse>>builder().result(staff).build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('STAFF_CREATE')")
    public ApiResponse<UserResponse> create(@Valid @RequestBody StaffAccountRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank() || request.getPassword() == null || request.getPassword().length() < 6)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập và mật khẩu (ít nhất 6 ký tự) là bắt buộc");
        if (users.existsByUsername(request.getUsername())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng");
        var staffRole = roles.findById("STAFF").orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Chưa khởi tạo vai trò nhân viên; hãy khởi động lại ứng dụng"));
        User user = User.builder().username(request.getUsername().trim()).password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName()).lastName(request.getLastName()).dob(request.getDob())
                .roles(new HashSet<>(Set.of(staffRole))).build();
        return ApiResponse.<UserResponse>builder().result(mapper.toUserResponse(users.save(user))).build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('STAFF_UPDATE')")
    public ApiResponse<UserResponse> update(@PathVariable String id, @Valid @RequestBody StaffAccountRequest request) {
        User user = findStaff(id);
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getDob() != null) user.setDob(request.getDob());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 6) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu cần ít nhất 6 ký tự");
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return ApiResponse.<UserResponse>builder().result(mapper.toUserResponse(users.save(user))).build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('STAFF_DELETE')")
    public ApiResponse<Void> delete(@PathVariable String id) {
        User user = findStaff(id);
        String current = SecurityContextHolder.getContext().getAuthentication().getName();
        if (user.getUsername().equals(current)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xóa tài khoản đang đăng nhập");
        users.delete(user);
        return ApiResponse.<Void>builder().build();
    }

    private User findStaff(String id) {
        User user = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
        boolean isStaff = user.getRoles() != null && user.getRoles().stream().anyMatch(role -> "STAFF".equals(role.getName()));
        if (!isStaff) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tài khoản này không có vai trò nhân viên");
        return user;
    }
}

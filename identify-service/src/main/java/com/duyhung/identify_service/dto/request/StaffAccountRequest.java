package com.duyhung.identify_service.dto.request;

import com.duyhung.identify_service.validator.DobConstraint;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StaffAccountRequest {
    @Size(min = 4, message = "Tên đăng nhập cần ít nhất 4 ký tự")
    private String username;
    private String password;
    private String firstName;
    private String lastName;
    @DobConstraint(min = 16, message = "Nhân viên cần đủ 16 tuổi")
    private LocalDate dob;
}

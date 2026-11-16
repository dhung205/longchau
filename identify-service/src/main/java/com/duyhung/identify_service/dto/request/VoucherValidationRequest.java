package com.duyhung.identify_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class VoucherValidationRequest {
    @NotBlank
    private String code;
    @PositiveOrZero
    private long subtotal;
}

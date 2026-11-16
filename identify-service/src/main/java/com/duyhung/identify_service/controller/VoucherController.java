package com.duyhung.identify_service.controller;

import com.duyhung.identify_service.dto.request.VoucherValidationRequest;
import com.duyhung.identify_service.dto.response.VoucherQuoteResponse;
import com.duyhung.identify_service.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vouchers")
@RequiredArgsConstructor
public class VoucherController {
    private final VoucherService service;

    @GetMapping("/manage") @PreAuthorize("hasRole('ADMIN')")
    public List<com.duyhung.identify_service.entity.Voucher> manage() { return service.manage(); }
    @PostMapping("/manage") @PreAuthorize("hasRole('ADMIN')")
    public com.duyhung.identify_service.entity.Voucher create(@RequestBody com.duyhung.identify_service.entity.Voucher input) {
        return service.save(input.getCode() == null ? "" : input.getCode(), input, true);
    }
    @PutMapping("/manage/{code}") @PreAuthorize("hasRole('ADMIN')")
    public com.duyhung.identify_service.entity.Voucher update(@PathVariable String code, @RequestBody com.duyhung.identify_service.entity.Voucher input) { return service.save(code, input, false); }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public List<VoucherQuoteResponse> available(@RequestParam(defaultValue = "0") long subtotal) {
        return service.available(subtotal);
    }

    @PostMapping("/validate")
    @PreAuthorize("hasRole('USER')")
    public VoucherQuoteResponse validate(@Valid @RequestBody VoucherValidationRequest request) {
        return service.validate(request.getCode(), request.getSubtotal());
    }
}

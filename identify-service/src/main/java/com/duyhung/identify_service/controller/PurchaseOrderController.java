package com.duyhung.identify_service.controller;

import com.duyhung.identify_service.dto.request.PurchaseOrderRequest;
import com.duyhung.identify_service.dto.request.OrderStatusRequest;
import com.duyhung.identify_service.dto.response.PurchaseOrderResponse;
import com.duyhung.identify_service.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class PurchaseOrderController {
    private final PurchaseOrderService service;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public PurchaseOrderResponse create(@Valid @RequestBody PurchaseOrderRequest request) { return service.create(request); }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public List<PurchaseOrderResponse> mine() { return service.mine(); }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public PurchaseOrderResponse detail(@PathVariable String id) { return service.detail(id); }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public PurchaseOrderResponse cancel(@PathVariable String id) { return service.cancel(id); }

    @PostMapping("/{id}/confirm-qr-payment")
    @PreAuthorize("hasRole('USER')")
    public PurchaseOrderResponse confirmQrPayment(@PathVariable String id) { return service.confirmQrPayment(id); }

    @GetMapping("/manage")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public List<PurchaseOrderResponse> allForStaff() { return service.allForStaff(); }

    @GetMapping("/manage/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public PurchaseOrderResponse detailForStaff(@PathVariable String id) { return service.detailForStaff(id); }

    @PatchMapping("/manage/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public PurchaseOrderResponse updateStatus(@PathVariable String id, @Valid @RequestBody OrderStatusRequest request) {
        return service.updateStatus(id, request.getStatus());
    }
}

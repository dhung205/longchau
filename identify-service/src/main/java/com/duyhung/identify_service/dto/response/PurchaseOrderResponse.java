package com.duyhung.identify_service.dto.response;

import com.duyhung.identify_service.enums.OrderStatus;
import com.duyhung.identify_service.enums.PaymentMethod;
import com.duyhung.identify_service.enums.PaymentStatus;
import com.duyhung.identify_service.enums.ShippingMethod;

import java.time.LocalDateTime;
import java.util.List;

public record PurchaseOrderResponse(
        String id,
        OrderStatus status,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        ShippingMethod shippingMethod,
        String recipientName,
        String phone,
        String province,
        String district,
        String address,
        String pickupStore,
        String note,
        long total,
        LocalDateTime createdAt,
        List<Item> items
) {
    public record Item(String medicineId, String medicineName, long unitPrice, int quantity) { }
}

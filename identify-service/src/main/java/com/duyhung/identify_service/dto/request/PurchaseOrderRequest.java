package com.duyhung.identify_service.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class PurchaseOrderRequest {
    @NotBlank @Size(max = 160)
    private String recipientName;
    @NotBlank @Size(max = 30)
    private String phone;
    @NotBlank
    private String shippingMethod;
    @NotBlank
    private String paymentMethod;
    @Size(max = 100)
    private String province;
    @Size(max = 100)
    private String district;
    @Size(max = 500)
    private String address;
    @Size(max = 250)
    private String pickupStore;
    @Size(max = 500)
    private String note;
    @NotEmpty @Valid
    private List<Item> items;

    @Data
    public static class Item {
        @NotBlank
        private String medicineId;
        @Min(1) @Max(1000)
        private int quantity;
    }
}

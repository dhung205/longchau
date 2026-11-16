package com.duyhung.identify_service.dto.response;

import java.math.BigDecimal;

public record VoucherQuoteResponse(String code, String title, long subtotal, long discount, long total,
                                   BigDecimal minimumSubtotal, BigDecimal percent, BigDecimal amount) {}

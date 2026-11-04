package com.duyhung.identify_service.dto.response;

import java.time.LocalDateTime;

public record ConsultationResponse(
        String id,
        String customerName,
        String customerId,
        String customerUsername,
        String question,
        String answer,
        String status,
        LocalDateTime createdAt,
        String attachmentName,
        String attachmentUrl,
        String attachmentContentType
) {}

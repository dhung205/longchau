package com.duyhung.identify_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConsultationAnswerRequest(@NotBlank @Size(max = 1000) String answer) {
}

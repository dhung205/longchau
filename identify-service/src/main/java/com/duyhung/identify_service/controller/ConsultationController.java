package com.duyhung.identify_service.controller;

import com.duyhung.identify_service.dto.request.ConsultationAnswerRequest;
import com.duyhung.identify_service.dto.response.ConsultationResponse;
import com.duyhung.identify_service.service.ConsultationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/consultations")
@RequiredArgsConstructor
public class ConsultationController {
    private final ConsultationService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ConsultationResponse submit(@RequestParam(value = "question", required = false) String question,
                                       @RequestPart(value = "attachment", required = false) MultipartFile attachment) {
        return service.submit(question, attachment);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('USER')")
    public List<ConsultationResponse> mine() { return service.mine(); }

    @GetMapping("/manage")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public List<ConsultationResponse> manage() { return service.manage(); }

    @GetMapping("/manage/pending-count")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public Map<String, Long> pendingCount() { return Map.of("count", service.pendingCount()); }

    @PatchMapping("/manage/{id}/answer")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ConsultationResponse answer(@PathVariable("id") String id, @Valid @RequestBody ConsultationAnswerRequest request) {
        return service.answer(id, request.answer());
    }

    @GetMapping("/{id}/attachment")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<FileSystemResource> attachment(@PathVariable("id") String id,
                                                         @RequestParam(value = "download", defaultValue = "false") boolean download) {
        ConsultationService.Attachment file = service.attachment(id);
        boolean inline = !download && (file.contentType().startsWith("image/") || file.contentType().equals("application/pdf"));
        ContentDisposition disposition = (inline ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(file.name(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store").header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType(file.contentType())).body(new FileSystemResource(file.path()));
    }
}

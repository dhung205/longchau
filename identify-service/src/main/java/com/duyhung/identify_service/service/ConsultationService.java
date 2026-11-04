package com.duyhung.identify_service.service;

import com.duyhung.identify_service.dto.response.ConsultationResponse;
import com.duyhung.identify_service.entity.Consultation;
import com.duyhung.identify_service.entity.User;
import com.duyhung.identify_service.repository.ConsultationRepository;
import com.duyhung.identify_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ConsultationService {
    private static final long MAX_ATTACHMENT_SIZE = 10L * 1024 * 1024;
    // A private separator keeps multiple staff messages in the existing answer column.
    // This avoids requiring a database migration while preserving old answers as-is.
    private static final String REPLY_SEPARATOR = "\n\n[[LC_CHAT_REPLY]]\n\n";
    private static final Map<String, String> TYPES = Map.ofEntries(
            Map.entry(".jpg", "image/jpeg"), Map.entry(".jpeg", "image/jpeg"), Map.entry(".png", "image/png"),
            Map.entry(".gif", "image/gif"), Map.entry(".webp", "image/webp"), Map.entry(".pdf", "application/pdf"),
            Map.entry(".doc", "application/msword"), Map.entry(".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry(".xls", "application/vnd.ms-excel"), Map.entry(".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    );
    private final ConsultationRepository consultations;
    private final UserRepository users;

    @Transactional
    public ConsultationResponse submit(String question, MultipartFile attachment) {
        User customer = currentUser();
        String text = question == null ? "" : question.trim();
        if (text.length() > 1000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Câu hỏi tối đa 1000 ký tự.");
        if (text.isEmpty() && (attachment == null || attachment.isEmpty()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhập câu hỏi hoặc chọn tệp đính kèm.");

        String ref = null;
        Path storedFile = null;
        if (attachment != null && !attachment.isEmpty()) {
            if (attachment.getSize() > MAX_ATTACHMENT_SIZE) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Tệp đính kèm tối đa 10 MB.");
            String original = Optional.ofNullable(attachment.getOriginalFilename()).orElse("tep-dinh-kem");
            String ext = extension(original);
            if (!TYPES.containsKey(ext)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ nhận ảnh, PDF, Word hoặc Excel.");
            String safeName = original.replace('\\', '/'); safeName = safeName.substring(safeName.lastIndexOf('/') + 1).replaceAll("[\\r\\n\\t]", "_"); if (safeName.isBlank()) safeName = "tep-dinh-kem" + ext;
            String diskName = UUID.randomUUID() + ext;
            Path directory = Path.of("uploads", "consultations").toAbsolutePath().normalize();
            try {
                Files.createDirectories(directory);
                storedFile = directory.resolve(diskName).normalize();
                if (!storedFile.getParent().equals(directory)) throw new IOException("Invalid attachment path");
                attachment.transferTo(storedFile);
            } catch (IOException error) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không lưu được tệp đính kèm.");
            }
            String encodedName = Base64.getUrlEncoder().withoutPadding().encodeToString(safeName.getBytes(StandardCharsets.UTF_8));
            ref = diskName + "|" + encodedName;
        }
        Consultation item = Consultation.builder().customer(customer).question(text.isEmpty() ? "Đã gửi tệp đính kèm." : text)
                .attachmentRef(ref).status("PENDING").build();
        try {
            return response(consultations.saveAndFlush(item));
        } catch (RuntimeException error) {
            if (storedFile != null) try { Files.deleteIfExists(storedFile); } catch (IOException ignored) {}
            throw error;
        }
    }

    @Transactional(readOnly = true)
    public List<ConsultationResponse> mine() {
        return consultations.findByCustomer_IdOrderByCreatedAtDesc(currentUser().getId()).stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public List<ConsultationResponse> manage() {
        return consultations.findAllByOrderByCreatedAtDesc().stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public long pendingCount() { return consultations.countByStatus("PENDING"); }

    @Transactional
    public ConsultationResponse answer(String id, String answer) {
        Consultation item = consultations.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu tư vấn."));
        String text = answer == null ? "" : answer.trim();
        if (text.isEmpty() || text.length() > 1000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Câu trả lời không được để trống và tối đa 1000 ký tự.");
        List<Consultation> conversationRows = item.getCustomer() == null
                ? List.of(item)
                : consultations.findByCustomer_IdOrderByCreatedAtDesc(item.getCustomer().getId());
        Consultation lastMessage = conversationRows.isEmpty() ? item : conversationRows.get(0);
        String previous = lastMessage.getAnswer();
        String timestampedText = "[[LC_AT:" + LocalDateTime.now().withNano(0) + "]]\n" + text;
        String answerHistory = previous == null || previous.isBlank() ? timestampedText : previous + REPLY_SEPARATOR + timestampedText;
        if (answerHistory.length() > 1000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đoạn chat đã đạt giới hạn lưu trữ. Hãy tạo câu hỏi mới để tiếp tục trao đổi.");
        lastMessage.setAnswer(answerHistory);
        for (Consultation message : conversationRows) {
            if ("PENDING".equals(message.getStatus())) message.setStatus("ANSWERED");
        }
        consultations.saveAll(conversationRows);
        return response(consultations.saveAndFlush(lastMessage));
    }

    @Transactional(readOnly = true)
    public Attachment attachment(String id) {
        Consultation item = consultations.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean staff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
        if (!staff && (item.getCustomer() == null || !item.getCustomer().getId().equals(currentUser().getId())))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Parsed parsed = parseRef(item.getAttachmentRef());
        if (parsed == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Path directory = Path.of("uploads", "consultations").toAbsolutePath().normalize();
        Path path = directory.resolve(parsed.diskName()).normalize();
        if (!path.getParent().equals(directory) || !Files.isRegularFile(path)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return new Attachment(path, parsed.name(), TYPES.get(extension(parsed.diskName())));
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private ConsultationResponse response(Consultation item) {
        Parsed parsed = parseRef(item.getAttachmentRef());
        return new ConsultationResponse(item.getId(), item.getCustomer() == null ? "Khách hàng" : item.getCustomer().getFullName(),
                item.getCustomer() == null ? null : item.getCustomer().getId(),
                item.getCustomer() == null ? null : item.getCustomer().getUsername(),
                item.getQuestion(), item.getAnswer(), item.getStatus(), item.getCreatedAt(), parsed == null ? null : parsed.name(),
                parsed == null ? null : "/consultations/" + item.getId() + "/attachment",
                parsed == null ? null : TYPES.get(extension(parsed.diskName())));
    }

    private Parsed parseRef(String ref) {
        if (ref == null || ref.isBlank()) return null;
        String[] parts = ref.split("\\|", 2);
        if (!parts[0].matches("[a-f0-9-]{36}\\.(pdf|docx?|xlsx?|jpe?g|png|gif|webp)")) return null;
        String name = parts[0];
        if (parts.length == 2) try { name = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8); } catch (IllegalArgumentException ignored) {}
        return new Parsed(parts[0], name);
    }

    private String extension(String filename) {
        String clean = filename.toLowerCase(Locale.ROOT);
        int dot = clean.lastIndexOf('.');
        return dot < 0 ? "" : clean.substring(dot);
    }

    private record Parsed(String diskName, String name) {}
    public record Attachment(Path path, String name, String contentType) {}
}

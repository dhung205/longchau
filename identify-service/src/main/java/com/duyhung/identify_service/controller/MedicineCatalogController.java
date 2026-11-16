package com.duyhung.identify_service.controller;

import com.duyhung.identify_service.entity.Medicine;
import com.duyhung.identify_service.repository.MedicineRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/catalog/medicines")
public class MedicineCatalogController {
    private final MedicineRepository repository;

    public MedicineCatalogController(MedicineRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Medicine> list() {
        return repository.findAllByOrderByNameAsc().stream().map(MedicineCatalogController::summary).toList();
    }

    static Medicine summary(Medicine source) {
            Medicine result = new Medicine();
            org.springframework.beans.BeanUtils.copyProperties(source, result);
            if (source.getImageData() != null && source.getImageData().matches("(?s)^data:image/(png|jpeg|webp|gif);base64,.*"))
                result.setImageData("catalog/medicines/" + source.getId() + "/image");
            return result;
    }

    @GetMapping("/{id}/image")
    public org.springframework.http.ResponseEntity<byte[]> image(@PathVariable String id) {
        String data = repository.findById(id).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND)).getImageData();
        if (data == null || !data.startsWith("data:image/") || !data.contains(";base64,"))
            return org.springframework.http.ResponseEntity.notFound().build();
        try {
            int comma = data.indexOf(',');
            String type = data.substring(5, data.indexOf(';'));
            if (!java.util.Set.of("image/png", "image/jpeg", "image/webp", "image/gif").contains(type)) return org.springframework.http.ResponseEntity.notFound().build();
            return org.springframework.http.ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noCache())
                .contentType(org.springframework.http.MediaType.parseMediaType(type)).body(java.util.Base64.getDecoder().decode(data.substring(comma + 1)));
        } catch (IllegalArgumentException ex) { return org.springframework.http.ResponseEntity.notFound().build(); }
    }
}

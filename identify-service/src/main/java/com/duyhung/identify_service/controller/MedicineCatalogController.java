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
        return repository.findAllByOrderByNameAsc();
    }
}

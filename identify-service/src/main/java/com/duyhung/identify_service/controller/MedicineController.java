package com.duyhung.identify_service.controller;

import com.duyhung.identify_service.entity.Medicine;
import com.duyhung.identify_service.repository.MedicineRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/medicines")
public class MedicineController {
    private final MedicineRepository repo;

    public MedicineController(MedicineRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('MEDICINE_READ') or hasAuthority('MEDICINE_CREATE') or hasAuthority('MEDICINE_UPDATE') or hasAuthority('MEDICINE_DELETE')")
    public List<Medicine> list() {
        return repo.findAllByOrderByNameAsc().stream().map(MedicineCatalogController::summary).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('MEDICINE_READ') or hasAuthority('MEDICINE_CREATE') or hasAuthority('MEDICINE_UPDATE') or hasAuthority('MEDICINE_DELETE')")
    public Medicine get(@PathVariable String id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('MEDICINE_CREATE')")
    public Medicine create(@Valid @RequestBody Medicine input) {
        validate(input);
        return repo.save(input);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('MEDICINE_UPDATE')")
    public Medicine update(@PathVariable String id, @Valid @RequestBody Medicine input) {
        Medicine m = get(id);
        m.setName(input.getName());
        m.setIngredient(input.getIngredient());
        m.setCategory(input.getCategory());
        m.setExpiryDate(input.getExpiryDate());
        m.setPrice(input.getPrice());
        m.setStock(input.getStock());
        m.setFunctionText(input.getFunctionText());
        m.setRecommendation(input.getRecommendation());
        if (!java.util.Objects.equals(input.getImageData(), "catalog/medicines/" + id + "/image")) m.setImageData(input.getImageData());
        validate(m);
        return repo.save(m);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('MEDICINE_DELETE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        repo.delete(get(id));
    }

    private void validate(Medicine m) {
        if (m.getName() == null || m.getName().isBlank() || m.getExpiryDate() == null || m.getPrice() < 0 || m.getStock() < 0 || m.getFunctionText() == null || m.getFunctionText().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên, hạn sử dụng và công dụng là bắt buộc");
        if (m.getExpiryDate().isBefore(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hạn sử dụng phải là hôm nay hoặc trong tương lai");
    }
}

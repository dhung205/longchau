package com.duyhung.identify_service.controller;
import com.duyhung.identify_service.entity.Medicine;
import com.duyhung.identify_service.repository.MedicineRepository;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class MedicineCatalogControllerTest {
 @Test void listDoesNotEmbedOrOverwriteImage() {
  var repo=mock(MedicineRepository.class); var medicine=new Medicine(); medicine.setId("test"); medicine.setImageData("data:image/png;base64,AQID");
  when(repo.findAllByOrderByNameAsc()).thenReturn(List.of(medicine)); when(repo.findById("test")).thenReturn(Optional.of(medicine));
  var controller=new MedicineCatalogController(repo);
  assertEquals("catalog/medicines/test/image",controller.list().get(0).getImageData());
  assertEquals("data:image/png;base64,AQID",medicine.getImageData());
  assertArrayEquals(new byte[]{1,2,3},controller.image("test").getBody());
 }
 @Test void invalidImageReturnsNotFound() {
  var repo=mock(MedicineRepository.class);var medicine=new Medicine();medicine.setImageData("data:image/png;base64,INVALID!");when(repo.findById("test")).thenReturn(Optional.of(medicine));
  assertEquals(404,new MedicineCatalogController(repo).image("test").getStatusCode().value());
 }
}

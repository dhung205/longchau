package com.duyhung.identify_service.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.zip.ZipFile;

@RestController
@RequestMapping("/files")
public class FileController {
    @PostMapping
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 20L * 1024 * 1024)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File phải có dung lượng từ 1 byte đến 20 MB");
        String original = Objects.toString(file.getOriginalFilename(), "");
        int dot = original.lastIndexOf('.');
        String ext = dot < 0 ? "" : original.substring(dot).toLowerCase(Locale.ROOT);
        if (!Set.of(".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".gif").contains(ext))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ nhận PDF, Word, Excel và ảnh JPG, PNG, GIF");
        Path directory = Path.of("uploads").toAbsolutePath().normalize();
        Files.createDirectories(directory);
        String filename = UUID.randomUUID() + ext;
        Path destination = directory.resolve(filename);
        boolean saved = false;
        try {
            try (InputStream input = file.getInputStream()) { Files.copy(input, destination); }
            byte[] header;
            try (InputStream input = Files.newInputStream(destination)) { header = input.readNBytes(8); }
            boolean valid;
            if (Set.of(".jpg", ".jpeg", ".png", ".gif").contains(ext)) {
                String expected = ext.equals(".jpg") || ext.equals(".jpeg") ? "JPEG" : ext.substring(1).toUpperCase(Locale.ROOT);
                try (var imageInput = javax.imageio.ImageIO.createImageInputStream(destination.toFile())) {
                    var readers = javax.imageio.ImageIO.getImageReaders(imageInput);
                    valid = false;
                    if (readers.hasNext()) {
                        var reader = readers.next();
                        try {
                            reader.setInput(imageInput);
                            valid = reader.getFormatName().equalsIgnoreCase(expected) && reader.getWidth(0) > 0 && reader.getHeight(0) > 0
                                    && (long) reader.getWidth(0) * reader.getHeight(0) <= 40_000_000;
                        } finally { reader.dispose(); }
                    }
                }
            } else if (ext.equals(".pdf")) {
                valid = header.length >= 5 && new String(header, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-");
            } else if (ext.equals(".docx") || ext.equals(".xlsx")) {
                try (ZipFile zip = new ZipFile(destination.toFile())) {
                    valid = zip.getEntry("[Content_Types].xml") != null && zip.getEntry(ext.equals(".docx") ? "word/document.xml" : "xl/workbook.xml") != null;
                } catch (java.util.zip.ZipException error) { valid = false; }
            } else {
                valid = Arrays.equals(header, new byte[]{(byte)0xD0,(byte)0xCF,0x11,(byte)0xE0,(byte)0xA1,(byte)0xB1,0x1A,(byte)0xE1});
            }
            if (!valid) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung file không phù hợp với định dạng");
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            Properties metadata = new Properties();
            metadata.setProperty("owner", auth.getName());
            metadata.setProperty("name", original);
            try (var output = Files.newOutputStream(directory.resolve(filename + ".meta"))) { metadata.store(output, null); }
            saved = true;
            return Map.of("filename", filename, "originalName", original, "size", file.getSize());
        } finally { if (!saved) Files.deleteIfExists(destination); }
    }
    private boolean visible(Path path) throws IOException {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        Path metadata = path.resolveSibling(path.getFileName() + ".meta");
        if (!Files.exists(metadata)) return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Properties props = new Properties();
        try (var input = Files.newInputStream(metadata)) { props.load(input); }
        return auth.getName().equals(props.getProperty("owner"));
    }
    private String displayName(Path path) throws IOException {
        Path metadata = path.resolveSibling(path.getFileName() + ".meta");
        if (!Files.exists(metadata)) return path.getFileName().toString();
        Properties props = new Properties();
        try (var input = Files.newInputStream(metadata)) { props.load(input); }
        return props.getProperty("name", path.getFileName().toString());
    }
    @GetMapping
    public List<Map<String,Object>> list() throws IOException {
        Path directory = Path.of("uploads").toAbsolutePath().normalize();
        if (!Files.isDirectory(directory)) return List.of();
        List<Map<String,Object>> result = new ArrayList<>();
        try (var paths = Files.list(directory)) {
            for (Path path : paths.filter(Files::isRegularFile).toList()) {
                if (!path.getFileName().toString().matches("[a-f0-9-]{36}\\.(pdf|docx?|xlsx?|jpe?g|png|gif)") || !visible(path)) continue;
                result.add(Map.of("filename",path.getFileName().toString(),"name",displayName(path),"size",Files.size(path)));
            }
        }
        return result;
    }
    @GetMapping("/{filename}")
    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> read(@PathVariable String filename, @RequestParam(defaultValue="false") boolean preview) throws IOException {
        if (!filename.matches("[a-f0-9-]{36}\\.(pdf|docx?|xlsx?|jpe?g|png|gif)")) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Path path = Path.of("uploads").toAbsolutePath().normalize().resolve(filename);
        if (!Files.isRegularFile(path) || !visible(path)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        boolean inline = preview && filename.matches(".*\\.(pdf|jpe?g|png|gif)");
        var disposition = (inline ? org.springframework.http.ContentDisposition.inline() : org.springframework.http.ContentDisposition.attachment()).filename(displayName(path), java.nio.charset.StandardCharsets.UTF_8).build();
        return org.springframework.http.ResponseEntity.ok().header("Content-Disposition",disposition.toString()).header("Cache-Control","no-store").header("X-Content-Type-Options","nosniff")
                .contentType(inline ? org.springframework.http.MediaType.parseMediaType(filename.endsWith(".pdf") ? "application/pdf" : filename.endsWith(".png") ? "image/png" : filename.endsWith(".gif") ? "image/gif" : "image/jpeg") : org.springframework.http.MediaType.APPLICATION_OCTET_STREAM).body(new org.springframework.core.io.FileSystemResource(path));
    }
    @DeleteMapping("/{filename}")
    public Map<String,Boolean> delete(@PathVariable String filename) throws IOException {
        if (!filename.matches("[a-f0-9-]{36}\\.(pdf|docx?|xlsx?|jpe?g|png|gif)")) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Path directory = Path.of("uploads").toAbsolutePath().normalize();
        Path path = directory.resolve(filename).normalize();
        if (!path.getParent().equals(directory) || !Files.isRegularFile(path) || !visible(path)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Files.delete(path);
        Files.deleteIfExists(path.resolveSibling(filename + ".meta"));
        return Map.of("deleted", true);
    }
}
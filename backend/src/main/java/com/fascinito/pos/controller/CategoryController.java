package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.category.CategoryRequest;
import com.fascinito.pos.dto.category.CategoryResponse;
import com.fascinito.pos.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.logging.Logger;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<PageResponse<CategoryResponse>> getAllCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<CategoryResponse> categories = categoryService.getAllCategories(pageable, search, active);
        
        PageResponse<CategoryResponse> response = PageResponse.<CategoryResponse>builder()
                .content(categories.getContent())
                .pageNumber(categories.getNumber())
                .pageSize(categories.getSize())
                .totalElements(categories.getTotalElements())
                .totalPages(categories.getTotalPages())
                .last(categories.isLast())
                .first(categories.isFirst())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllActiveCategories() {
        List<CategoryResponse> categories = categoryService.getAllActiveCategories();
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Active categories retrieved successfully",
                categories,
                LocalDateTime.now()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable Long id) {
        CategoryResponse category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Category retrieved successfully",
                category,
                LocalDateTime.now()
        ));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(
                true,
                "Category created successfully",
                category,
                LocalDateTime.now()
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Category updated successfully",
                category,
                LocalDateTime.now()
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Category deleted successfully",
                null,
                LocalDateTime.now()
        ));
    }

    /**
     * Upload category image
     * POST /api/categories/upload-image
     * Accepts multipart image file
     */
    @PostMapping("/upload-image")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(
                        false,
                        "File is empty",
                        null,
                        LocalDateTime.now()
                ));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(
                        false,
                        "File must be an image",
                        null,
                        LocalDateTime.now()
                ));
            }

            // Validate file size (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(
                        false,
                        "File size must not exceed 5MB",
                        null,
                        LocalDateTime.now()
                ));
            }

            // Create uploads directory if it doesn't exist
            String uploadBasePath = System.getenv("UPLOAD_BASE_PATH") != null
                    ? System.getenv("UPLOAD_BASE_PATH")
                    : "uploads";
            Path uploadsDir = Paths.get(uploadBasePath, "categories");
            Files.createDirectories(uploadsDir);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadsDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return file URL (relative path for frontend)
            Map<String, String> response = new HashMap<>();
            response.put("url", "/uploads/categories/" + filename);
            response.put("filename", filename);

            return ResponseEntity.ok(new ApiResponse<>(
                    true,
                    "Image uploaded successfully",
                    response,
                    LocalDateTime.now()
            ));
        } catch (IOException e) {
            Logger.getLogger(CategoryController.class.getName()).severe("Error uploading image: " + e.getMessage());
            return ResponseEntity.status(500).body(new ApiResponse<>(
                    false,
                    "Failed to upload image: " + e.getMessage(),
                    null,
                    LocalDateTime.now()
            ));
        }
    }
}

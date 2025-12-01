package com.fascinito.pos.controller;

import com.fascinito.pos.dto.ApiResponse;
import com.fascinito.pos.dto.PageResponse;
import com.fascinito.pos.dto.product.ProductRequest;
import com.fascinito.pos.dto.product.ProductResponse;
import com.fascinito.pos.service.ProductService;
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

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<PageResponse<ProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long vendorId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Boolean visibleToCustomers,
            @RequestParam(required = false) Boolean active
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ProductResponse> products = productService.getAllProducts(
                pageable, search, categoryId, vendorId, locationId, visibleToCustomers, active);
        
        PageResponse<ProductResponse> response = PageResponse.<ProductResponse>builder()
                .content(products.getContent())
                .pageNumber(products.getNumber())
                .pageSize(products.getSize())
                .totalElements(products.getTotalElements())
                .totalPages(products.getTotalPages())
                .last(products.isLast())
                .first(products.isFirst())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Product retrieved successfully",
                product,
                LocalDateTime.now()
        ));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySlug(@PathVariable String slug) {
        ProductResponse product = productService.getProductBySlug(slug);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Product retrieved successfully",
                product,
                LocalDateTime.now()
        ));
    }

    @GetMapping("/featured")
    public ResponseEntity<PageResponse<ProductResponse>> getFeaturedProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductResponse> products = productService.getFeaturedProducts(pageable);

        PageResponse<ProductResponse> response = PageResponse.<ProductResponse>builder()
                .content(products.getContent())
                .pageNumber(products.getNumber())
                .pageSize(products.getSize())
                .totalElements(products.getTotalElements())
                .totalPages(products.getTotalPages())
                .last(products.isLast())
                .first(products.isFirst())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(
                true,
                "Product created successfully",
                product,
                LocalDateTime.now()
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.updateProduct(id, request);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Product updated successfully",
                product,
                LocalDateTime.now()
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Product deleted successfully",
                null,
                LocalDateTime.now()
        ));
    }

    /**
     * Upload product image
     * POST /api/products/upload-image
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
            // Use absolute path to ensure it works in Docker and local environments
            String uploadBasePath = System.getenv("UPLOAD_BASE_PATH") != null
                    ? System.getenv("UPLOAD_BASE_PATH")
                    : "uploads";
            Path uploadsDir = Paths.get(uploadBasePath, "products");
            Files.createDirectories(uploadsDir);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            // Save file with StandardCopyOption
            Path filePath = uploadsDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return file URL (relative path for frontend)
            Map<String, String> response = new HashMap<>();
            response.put("url", "/uploads/products/" + filename);
            response.put("filename", filename);

            return ResponseEntity.ok(new ApiResponse<>(
                    true,
                    "Image uploaded successfully",
                    response,
                    LocalDateTime.now()
            ));
        } catch (IOException e) {
            Logger.getLogger(ProductController.class.getName()).severe("Error uploading image: " + e.getMessage());
            return ResponseEntity.status(500).body(new ApiResponse<>(
                    false,
                    "Failed to upload image: " + e.getMessage(),
                    null,
                    LocalDateTime.now()
            ));
        }
    }
}

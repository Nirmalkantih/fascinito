package com.fascinito.pos.service;

import com.fascinito.pos.dto.product.*;
import com.fascinito.pos.entity.*;
import com.fascinito.pos.exception.BadRequestException;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.*;
import lombok.RequiredArgsConstructor;
import java.util.Collections;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final VendorRepository vendorRepository;
    private final LocationRepository locationRepository;
    private final ProductVariantCombinationRepository variantCombinationRepository;
    private final ProductVariantCombinationOptionRepository variantCombinationOptionRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(
            Pageable pageable,
            String search,
            Long categoryId,
            Long vendorId,
            Long locationId,
            Boolean visibleToCustomers,
            Boolean active
    ) {
        // Use optimized repository methods for common queries to avoid N+1
        if (search == null && vendorId == null && locationId == null) {
            // Use optimized repository method for visible/active products
            if (Boolean.TRUE.equals(visibleToCustomers) && Boolean.TRUE.equals(active)) {
                if (categoryId != null) {
                    return productRepository.findByCategoryIdAndVisibleToCustomersTrueAndActiveTrue(categoryId, pageable)
                            .map(this::mapToResponse);
                } else {
                    return productRepository.findByVisibleToCustomersTrueAndActiveTrue(pageable)
                            .map(this::mapToResponse);
                }
            } else if (Boolean.TRUE.equals(visibleToCustomers)) {
                return productRepository.findByVisibleToCustomersTrue(pageable)
                        .map(this::mapToResponse);
            }
        }

        // Fall back to Specification for complex queries
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), searchPattern),
                        cb.like(cb.lower(root.get("description")), searchPattern),
                        cb.like(cb.lower(root.get("sku")), searchPattern)
                ));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (vendorId != null) {
                predicates.add(cb.equal(root.get("vendor").get("id"), vendorId));
            }

            if (locationId != null) {
                predicates.add(cb.equal(root.get("location").get("id"), locationId));
            }

            if (visibleToCustomers != null) {
                predicates.add(cb.equal(root.get("visibleToCustomers"), visibleToCustomers));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));
        // Explicitly initialize variant combinations to avoid lazy loading issues
        if (product.getVariantCombinations() != null) {
            product.getVariantCombinations().size();
            // Also initialize the options for each combination
            product.getVariantCombinations().forEach(comb -> {
                if (comb.getOptions() != null) {
                    comb.getOptions().size();
                }
            });
        }
        // Initialize specifications to avoid lazy loading issues
        if (product.getSpecifications() != null) {
            product.getSpecifications().size();
        }
        return mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getFeaturedProducts(Pageable pageable) {
        return productRepository.findByFeaturedTrueAndVisibleToCustomersTrueAndActiveTrue(pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        // Validate unique slug
        if (productRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Product with slug '" + request.getSlug() + "' already exists");
        }

        // Validate unique SKU if provided
        if (request.getSku() != null && productRepository.existsBySku(request.getSku())) {
            throw new BadRequestException("Product with SKU '" + request.getSku() + "' already exists");
        }

        Product product = new Product();
        mapRequestToEntity(request, product);

        Product savedProduct = productRepository.save(product);
        log.info("Product created: {}", savedProduct.getId());
        return mapToResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // Validate unique slug
        if (!product.getSlug().equals(request.getSlug()) && 
            productRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Product with slug '" + request.getSlug() + "' already exists");
        }

        // Validate unique SKU if provided
        if (request.getSku() != null &&
            !request.getSku().equals(product.getSku()) &&
            productRepository.existsBySku(request.getSku())) {
            throw new BadRequestException("Product with SKU '" + request.getSku() + "' already exists");
        }

        // Ensure variant combinations are loaded before clearing them (lazy load trigger)
        product.getVariantCombinations().size();

        mapRequestToEntity(request, product);

        // Flush to ensure orphan removal happens before new inserts
        entityManager.flush();

        Product savedProduct = productRepository.save(product);
        log.info("Product updated: {}", savedProduct.getId());
        return mapToResponse(savedProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        
        productRepository.delete(product);
        log.info("Product deleted: {}", id);
    }

    private void mapRequestToEntity(ProductRequest request, Product product) {
        product.setTitle(request.getTitle());
        product.setSlug(request.getSlug());
        product.setDescription(request.getDescription());
        product.setDetailedDescription(request.getDetailedDescription());
        product.setSku(request.getSku());
        product.setUpc(request.getUpc());
        product.setRegularPrice(request.getRegularPrice());
        product.setSalePrice(request.getSalePrice());
        product.setCostPerItem(request.getCostPerItem());
        product.setTaxRate(request.getTaxRate());
        product.setTaxExempt(request.getTaxExempt());
        product.setVisibleToCustomers(request.getVisibleToCustomers());
        product.setTrackInventory(request.getTrackInventory());
        product.setStockQuantity(request.getStockQuantity());
        product.setLowStockThreshold(request.getLowStockThreshold());
        product.setActive(request.getActive());
        product.setFeatured(request.getFeatured());

        // Set relationships
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        if (request.getSubCategoryId() != null) {
            SubCategory subCategory = subCategoryRepository.findById(request.getSubCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found"));
            product.setSubCategory(subCategory);
        } else {
            product.setSubCategory(null);
        }

        if (request.getVendorId() != null) {
            Vendor vendor = vendorRepository.findById(request.getVendorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
            product.setVendor(vendor);
        } else {
            product.setVendor(null);
        }

        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
            product.setLocation(location);
        } else {
            product.setLocation(null);
        }

        // Handle images
        if (request.getImageUrls() != null) {
            // Remove existing images properly
            if (product.getImages() != null && !product.getImages().isEmpty()) {
                product.getImages().clear();
            }
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                ProductImage image = new ProductImage();
                image.setImageUrl(request.getImageUrls().get(i));
                image.setAltText(product.getTitle());
                image.setDisplayOrder(i);
                image.setProduct(product);
                product.getImages().add(image);
            }
        }

        // Handle variations
        if (request.getVariations() != null) {
            // Get existing variations for update instead of delete/insert
            Map<Long, ProductVariation> existingVariations = new HashMap<>();
            if (product.getVariations() != null && !product.getVariations().isEmpty()) {
                for (ProductVariation var : product.getVariations()) {
                    if (var.getId() != null) {
                        existingVariations.put(var.getId(), var);
                    }
                }
            }

            // Clear and rebuild variations list
            if (product.getVariations() != null && !product.getVariations().isEmpty()) {
                product.getVariations().clear();
            }

            for (ProductVariationRequest varReq : request.getVariations()) {
                ProductVariation variation;

                // If variation has an ID, update existing; otherwise create new
                if (varReq.getId() != null && existingVariations.containsKey(varReq.getId())) {
                    variation = existingVariations.get(varReq.getId());
                } else {
                    variation = new ProductVariation();
                }

                variation.setType(varReq.getType());
                variation.setActive(varReq.getActive() != null ? varReq.getActive() : true);

                // Handle variation options - UPDATE existing options instead of delete/recreate
                if (varReq.getOptions() != null && !varReq.getOptions().isEmpty()) {
                    // Build map of existing options by ID for updates
                    Map<Long, VariationOption> existingOptions = new HashMap<>();
                    if (variation.getOptions() != null) {
                        for (VariationOption opt : variation.getOptions()) {
                            if (opt.getId() != null) {
                                existingOptions.put(opt.getId(), opt);
                            }
                        }
                    } else {
                        variation.setOptions(new java.util.ArrayList<>());
                    }

                    // Track which options are in the new request
                    Set<Long> requestedOptionIds = new HashSet<>();

                    for (com.fascinito.pos.dto.product.VariationOptionRequest optReq : varReq.getOptions()) {
                        VariationOption option;
                        
                        // If option has an ID and exists, update it; otherwise create new
                        if (optReq.getId() != null && existingOptions.containsKey(optReq.getId())) {
                            option = existingOptions.get(optReq.getId());
                            requestedOptionIds.add(optReq.getId());
                        } else {
                            option = new VariationOption();
                            variation.getOptions().add(option);
                        }
                        
                        option.setName(optReq.getName());
                        option.setPriceAdjustment(optReq.getPriceAdjustment() != null ? optReq.getPriceAdjustment() : BigDecimal.ZERO);
                        option.setStockQuantity(optReq.getStockQuantity() != null ? optReq.getStockQuantity() : 0);
                        option.setSku(optReq.getSku());
                        option.setImageUrl(optReq.getImageUrl());
                        option.setActive(optReq.getActive() != null ? optReq.getActive() : true);
                        option.setVariation(variation);
                    }

                    // Remove options that are no longer in the request
                    // IMPORTANT: Instead of deleting options in cart, mark them as inactive
                    if (variation.getOptions() != null) {
                        for (VariationOption existingOpt : new ArrayList<>(variation.getOptions())) {
                            if (existingOpt.getId() != null && !requestedOptionIds.contains(existingOpt.getId())) {
                                // Check if this option is in any cart before removing
                                // For now, just mark as inactive instead of deleting to avoid FK constraint issues
                                existingOpt.setActive(false);
                                log.info("Marked variation option {} as inactive (was removed from product)", existingOpt.getId());
                            }
                        }
                    }
                }

                variation.setProduct(product);
                product.getVariations().add(variation);
            }
        }

        // Flush variations and options to database first so they become managed entities
        // This ensures VariationOption objects have IDs before we use them in combinations
        entityManager.flush();

        // Generate variant combinations after variations are set and persisted
        if (product.getId() != null) {
            // For updates: delete old combinations via repository directly (not via entity)
            // This avoids stale object state issues with cascade deletion
            variantCombinationRepository.deleteByProductId(product.getId());
            // Flush to ensure deletion completes before generating new combinations
            entityManager.flush();
            log.info("Deleted old variant combinations for product {}", product.getId());
        }
        generateVariantCombinations(product);

        // Handle specifications
        if (request.getSpecifications() != null) {
            // Remove existing specifications
            if (product.getSpecifications() != null && !product.getSpecifications().isEmpty()) {
                product.getSpecifications().clear();
            }
            for (ProductSpecificationRequest specReq : request.getSpecifications()) {
                ProductSpecification spec = ProductSpecification.builder()
                        .product(product)
                        .attributeName(specReq.getAttributeName())
                        .attributeValue(specReq.getAttributeValue())
                        .displayOrder(specReq.getDisplayOrder() != null ? specReq.getDisplayOrder() : 0)
                        .build();
                product.getSpecifications().add(spec);
            }
        }
    }

    /**
     * Generate all possible combinations from product variations
     * and save them to product_variant_combination table
     */
    private void generateVariantCombinations(Product product) {
        if (product.getVariations() == null || product.getVariations().isEmpty()) {
            return;
        }

        // Get all active variations with their options
        List<ProductVariation> variations = product.getVariations().stream()
                .filter(v -> v.getActive() != null && v.getActive())
                .collect(Collectors.toList());

        if (variations.isEmpty()) {
            return;
        }

        // Get all options for each variation
        List<List<VariationOption>> allOptions = new ArrayList<>();
        for (ProductVariation variation : variations) {
            List<VariationOption> activeOptions = variation.getOptions().stream()
                    .filter(o -> o.getActive() != null && o.getActive())
                    .collect(Collectors.toList());
            if (!activeOptions.isEmpty()) {
                allOptions.add(activeOptions);
            }
        }

        if (allOptions.isEmpty()) {
            return;
        }

        // Generate all combinations using Cartesian product
        List<List<VariationOption>> combinations = cartesianProduct(allOptions);

        log.info("Generating {} variant combinations for product: {}", combinations.size(), product.getId());

        // Create ProductVariantCombination for each combination
        for (List<VariationOption> combination : combinations) {
            ProductVariantCombination variantCombination = new ProductVariantCombination();
            variantCombination.setProduct(product);
            variantCombination.setActive(true);

            // Calculate price: product base price + sum of all option adjustments
            BigDecimal totalPrice = product.getRegularPrice() != null ? product.getRegularPrice() : BigDecimal.ZERO;
            for (VariationOption option : combination) {
                if (option.getPriceAdjustment() != null) {
                    totalPrice = totalPrice.add(option.getPriceAdjustment());
                }
            }
            variantCombination.setPrice(totalPrice);

            // Set initial stock: use product stock or sum of option stocks
            int stock = 0;
            if (product.getStockQuantity() != null && product.getStockQuantity() > 0) {
                // If product has stock, distribute it
                stock = product.getStockQuantity() / Math.max(1, combinations.size());
            } else {
                // Use minimum stock from options
                stock = combination.stream()
                        .mapToInt(opt -> opt.getStockQuantity() != null ? opt.getStockQuantity() : 0)
                        .min()
                        .orElse(0);
            }
            variantCombination.setStock(stock);

            // Add all options to this combination
            for (VariationOption option : combination) {
                variantCombination.addOption(option);
            }

            // Add combination to product (Hibernate will cascade persist)
            product.getVariantCombinations().add(variantCombination);

            log.debug("Created variant combination with options: {}",
                    combination.stream().map(VariationOption::getName).collect(Collectors.toList()));
        }
    }

    /**
     * Generate Cartesian product of lists
     * Example: [[A, B], [1, 2], [X, Y]] -> [[A,1,X], [A,1,Y], [A,2,X], [A,2,Y], [B,1,X], ...]
     */
    private <T> List<List<T>> cartesianProduct(List<List<T>> input) {
        List<List<T>> result = new ArrayList<>();

        if (input.isEmpty()) {
            return result;
        }

        // Start with the first list
        for (T item : input.get(0)) {
            result.add(new ArrayList<>(Collections.singletonList(item)));
        }

        // Gradually add items from the rest of the lists
        for (int i = 1; i < input.size(); i++) {
            List<List<T>> temp = new ArrayList<>();
            for (List<T> existing : result) {
                for (T item : input.get(i)) {
                    List<T> newList = new ArrayList<>(existing);
                    newList.add(item);
                    temp.add(newList);
                }
            }
            result = temp;
        }

        return result;
    }

    private ProductResponse mapToResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setTitle(product.getTitle());
        response.setSlug(product.getSlug());
        response.setDescription(product.getDescription());
        response.setDetailedDescription(product.getDetailedDescription());
        response.setSku(product.getSku());
        response.setUpc(product.getUpc());
        response.setRegularPrice(product.getRegularPrice());
        response.setSalePrice(product.getSalePrice());
        response.setCostPerItem(product.getCostPerItem());
        response.setTaxRate(product.getTaxRate());
        response.setTaxExempt(product.getTaxExempt());
        response.setVisibleToCustomers(product.getVisibleToCustomers());
        response.setTrackInventory(product.getTrackInventory());
        response.setStockQuantity(product.getStockQuantity());
        response.setLowStockThreshold(product.getLowStockThreshold());

        // Calculate inStock:
        // 1. If inventory tracking is disabled, always true
        // 2. If product has variations, prioritize variation stock (must have at least one variation with stock > 0)
        // 3. If product has no variations, use product stock
        boolean inStock;
        if (!product.getTrackInventory()) {
            inStock = true;
        } else if (product.getVariations() != null && !product.getVariations().isEmpty()) {
            // Check if ANY variation option has stock > 0
            inStock = product.getVariations().stream()
                    .filter(v -> v.getActive() != null && v.getActive())
                    .flatMap(v -> v.getOptions().stream())
                    .filter(o -> o.getActive() != null && o.getActive())
                    .anyMatch(o -> o.getStockQuantity() != null && o.getStockQuantity() > 0);
        } else {
            // No variations, check product stock
            inStock = product.getStockQuantity() != null && product.getStockQuantity() > 0;
        }
        response.setInStock(inStock);

        // Set display stock quantity: prioritize variation stock if variations exist
        if (product.getVariations() != null && !product.getVariations().isEmpty()) {
            // For variations: find minimum stock from all active options (bottleneck stock)
            Integer minVariationStock = product.getVariations().stream()
                    .filter(v -> v.getActive() != null && v.getActive())
                    .flatMap(v -> v.getOptions().stream())
                    .filter(o -> o.getActive() != null && o.getActive())
                    .mapToInt(o -> o.getStockQuantity() != null ? o.getStockQuantity() : 0)
                    .min()
                    .orElse(0);
            response.setStockQuantity(minVariationStock);
        }
        // If no variations, stockQuantity is already set to product stock above

        response.setActive(product.getActive());
        response.setFeatured(product.getFeatured());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());

        if (product.getCategory() != null) {
            response.setCategoryId(product.getCategory().getId());
            response.setCategoryName(product.getCategory().getName());
        }

        if (product.getSubCategory() != null) {
            response.setSubCategoryId(product.getSubCategory().getId());
            response.setSubCategoryName(product.getSubCategory().getName());
        }

        if (product.getVendor() != null) {
            response.setVendorId(product.getVendor().getId());
            response.setVendorName(product.getVendor().getName());
        }

        if (product.getLocation() != null) {
            response.setLocationId(product.getLocation().getId());
            response.setLocationName(product.getLocation().getName());
        }

        // Map images - convert relative paths to absolute API URLs
        if (product.getImages() != null) {
            response.setImages(product.getImages().stream()
                    .map(img -> {
                        String imageUrl = img.getImageUrl();
                        // If image URL is relative (starts with /uploads), keep it as-is
                        // Frontend will handle prepending the API base URL
                        // If it's an external URL (http/https), use as-is
                        return new ProductImageResponse(
                                img.getId(),
                                imageUrl,
                                img.getAltText(),
                                img.getDisplayOrder()
                        );
                    })
                    .collect(Collectors.toList()));
        }

        // Map variations
        if (product.getVariations() != null) {
            response.setVariations(product.getVariations().stream()
                    .map(var -> {
                        ProductVariationResponse varResponse = new ProductVariationResponse();
                        varResponse.setId(var.getId());
                        varResponse.setType(var.getType());
                        varResponse.setActive(var.getActive());
                        varResponse.setCreatedAt(var.getCreatedAt());
                        varResponse.setUpdatedAt(var.getUpdatedAt());

                        // Map variation options
                        if (var.getOptions() != null && !var.getOptions().isEmpty()) {
                            varResponse.setOptions(var.getOptions().stream()
                                    .map(opt -> new com.fascinito.pos.dto.product.VariationOptionResponse(
                                            opt.getId(),
                                            opt.getName(),
                                            opt.getPriceAdjustment(),
                                            opt.getStockQuantity(),
                                            opt.getSku(),
                                            opt.getImageUrl(),
                                            opt.getActive(),
                                            opt.getCreatedAt(),
                                            opt.getUpdatedAt()
                                    ))
                                    .collect(Collectors.toList()));
                        }

                        return varResponse;
                    })
                    .collect(Collectors.toList()));
        }

        // Map variant combinations
        if (product.getVariantCombinations() != null && !product.getVariantCombinations().isEmpty()) {
            log.info("Mapping {} variant combinations for product {}", product.getVariantCombinations().size(), product.getId());
            response.setVariantCombinations(product.getVariantCombinations().stream()
                    .map(comb -> {
                        log.info("Processing combination {} with {} options", comb.getId(), comb.getOptions().size());
                        List<Long> optionIds = comb.getOptions().stream()
                                .map(opt -> opt.getVariationOption().getId())
                                .collect(Collectors.toList());
                        
                        return com.fascinito.pos.dto.product.VariantCombinationResponse.builder()
                                .id(comb.getId())
                                .price(comb.getPrice())
                                .stock(comb.getStock())
                                .active(comb.getActive())
                                .optionIds(optionIds)
                                .combinationName(comb.getCombinationName())
                                .build();
                    })
                    .collect(Collectors.toList()));
        } else {
            log.info("No variant combinations found for product {}", product.getId());
        }

        // Map specifications
        if (product.getSpecifications() != null && !product.getSpecifications().isEmpty()) {
            response.setSpecifications(product.getSpecifications().stream()
                    .sorted((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()))
                    .map(spec -> ProductSpecificationResponse.builder()
                            .id(spec.getId())
                            .attributeName(spec.getAttributeName())
                            .attributeValue(spec.getAttributeValue())
                            .displayOrder(spec.getDisplayOrder())
                            .build())
                    .collect(Collectors.toList()));
        }

        return response;
    }
}

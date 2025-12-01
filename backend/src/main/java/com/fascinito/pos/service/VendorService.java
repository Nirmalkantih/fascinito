package com.fascinito.pos.service;

import com.fascinito.pos.dto.vendor.VendorRequest;
import com.fascinito.pos.dto.vendor.VendorResponse;
import com.fascinito.pos.entity.Vendor;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.VendorRepository;
import com.fascinito.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorService {

    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<VendorResponse> getAllVendors(Pageable pageable, String search, Boolean active) {
        Specification<Vendor> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("email")), searchPattern),
                        cb.like(cb.lower(root.get("phone")), searchPattern)
                ));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return vendorRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<VendorResponse> getAllActiveVendors() {
        return vendorRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VendorResponse getVendorById(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));
        return mapToResponse(vendor);
    }

    @Transactional
    public VendorResponse createVendor(VendorRequest request) {
        Vendor vendor = new Vendor();
        mapRequestToEntity(request, vendor);

        Vendor savedVendor = vendorRepository.save(vendor);
        log.info("Vendor created: {}", savedVendor.getId());
        return mapToResponse(savedVendor);
    }

    @Transactional
    public VendorResponse updateVendor(Long id, VendorRequest request) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));

        mapRequestToEntity(request, vendor);

        Vendor savedVendor = vendorRepository.save(vendor);
        log.info("Vendor updated: {}", savedVendor.getId());
        return mapToResponse(savedVendor);
    }

    @Transactional
    public void deleteVendor(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));
        
        vendorRepository.delete(vendor);
        log.info("Vendor deleted: {}", id);
    }

    private void mapRequestToEntity(VendorRequest request, Vendor vendor) {
        vendor.setName(request.getName());
        vendor.setDescription(request.getDescription());
        vendor.setEmail(request.getEmail());
        vendor.setPhone(request.getPhone());
        vendor.setAddress(request.getAddress());
        vendor.setActive(request.getActive());
    }

    private VendorResponse mapToResponse(Vendor vendor) {
        VendorResponse response = new VendorResponse();
        response.setId(vendor.getId());
        response.setName(vendor.getName());
        response.setDescription(vendor.getDescription());
        response.setEmail(vendor.getEmail());
        response.setPhone(vendor.getPhone());
        response.setAddress(vendor.getAddress());
        response.setWebsite(null); // Not in entity yet
        response.setActive(vendor.getActive());
        // Count products from this vendor
        response.setProductCount(productRepository.countByVendorId(vendor.getId()).intValue());
        response.setCreatedAt(vendor.getCreatedAt());
        response.setUpdatedAt(vendor.getUpdatedAt());
        return response;
    }
}

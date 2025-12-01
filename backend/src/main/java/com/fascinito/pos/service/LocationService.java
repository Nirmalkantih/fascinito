package com.fascinito.pos.service;

import com.fascinito.pos.dto.location.LocationRequest;
import com.fascinito.pos.dto.location.LocationResponse;
import com.fascinito.pos.entity.Location;
import com.fascinito.pos.exception.ResourceNotFoundException;
import com.fascinito.pos.repository.LocationRepository;
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
public class LocationService {

    private final LocationRepository locationRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<LocationResponse> getAllLocations(Pageable pageable, String search, Boolean active) {
        Specification<Location> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("city")), searchPattern),
                        cb.like(cb.lower(root.get("state")), searchPattern)
                ));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return locationRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getAllActiveLocations() {
        return locationRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LocationResponse getLocationById(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));
        return mapToResponse(location);
    }

    @Transactional
    public LocationResponse createLocation(LocationRequest request) {
        Location location = new Location();
        mapRequestToEntity(request, location);

        Location savedLocation = locationRepository.save(location);
        log.info("Location created: {}", savedLocation.getId());
        return mapToResponse(savedLocation);
    }

    @Transactional
    public LocationResponse updateLocation(Long id, LocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));

        mapRequestToEntity(request, location);

        Location savedLocation = locationRepository.save(location);
        log.info("Location updated: {}", savedLocation.getId());
        return mapToResponse(savedLocation);
    }

    @Transactional
    public void deleteLocation(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));
        
        locationRepository.delete(location);
        log.info("Location deleted: {}", id);
    }

    private void mapRequestToEntity(LocationRequest request, Location location) {
        location.setName(request.getName());
        location.setAddress(request.getAddress());
        location.setCity(request.getCity());
        location.setState(request.getState());
        location.setZipCode(request.getZipCode());
        location.setCountry(request.getCountry());
        location.setPhone(request.getPhone());
        location.setActive(request.getActive());
    }

    private LocationResponse mapToResponse(Location location) {
        LocationResponse response = new LocationResponse();
        response.setId(location.getId());
        response.setName(location.getName());
        response.setAddress(location.getAddress());
        response.setCity(location.getCity());
        response.setState(location.getState());
        response.setZipCode(location.getZipCode());
        response.setCountry(location.getCountry());
        response.setPhone(location.getPhone());
        response.setActive(location.getActive());
        // Count products at this location
        response.setProductCount(productRepository.countByLocationId(location.getId()).intValue());
        response.setCreatedAt(location.getCreatedAt());
        response.setUpdatedAt(location.getUpdatedAt());
        return response;
    }
}

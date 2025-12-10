package com.fascinito.pos.repository;

import com.fascinito.pos.entity.Role;
import com.fascinito.pos.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    
    Optional<User> findByEmailAndDeletedFalse(String email);
    
    Optional<User> findByPhoneAndDeletedFalse(String phone);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByPhone(String phone);
    
    Boolean existsByEmailAndDeletedFalse(String email);
    
    Boolean existsByPhoneAndDeletedFalse(String phone);
    
    Long countByRoles_Name(Role.RoleType name);
}

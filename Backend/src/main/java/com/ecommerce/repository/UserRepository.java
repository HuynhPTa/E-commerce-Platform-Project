package com.ecommerce.repository;

import com.ecommerce.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmailAndIsDelete(String email, int isDelete);

    // Dùng cho OAuth2: tìm cả tài khoản đã xoá mềm để không tạo trùng email
    Optional<User> findByEmail(String email);

    boolean existsByEmailAndIsDelete(String email, int isDelete);

    // khoá dòng user trong transaction (SELECT ... FOR UPDATE).
    // Các thao tác địa chỉ của cùng một người sẽ chạy lần lượt, không chạy song song.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.email = :email and u.isDelete = 0")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    // Danh sách cho Admin: lọc theo vai trò / trạng thái + từ khoá (email, họ tên, SĐT)
    @Query("""
            select u from User u
            where u.isDelete = 0
              and (:status is null or u.status = :status)
              and (:role is null
                   or (:role = 'ADMIN' and (upper(u.role) = 'ADMIN' or u.admin = true))
                   or (:role = 'USER' and (u.role is null or upper(u.role) <> 'ADMIN') and u.admin = false))
              and (:term is null
                   or lower(u.email) like :term
                   or lower(u.firstName) like :term
                   or lower(u.lastName) like :term
                   or u.phone like :term)
            """)
    Page<User> adminSearch(@Param("role") String role,
                           @Param("status") Integer status,
                           @Param("term") String term,
                           Pageable pageable);

    long countByIsDelete(int isDelete);

    long countByIsDeleteAndStatus(int isDelete, int status);
}
package com.ecommerce.repository;

import com.ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    // Nạp sẵn parent để dựng cây trong bộ nhớ, tránh N+1
    @Query("select c from Category c left join fetch c.parent order by c.sortOrder asc, c.name asc")
    List<Category> findAllWithParent();

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Integer id);

    boolean existsByParentId(Integer parentId);
}

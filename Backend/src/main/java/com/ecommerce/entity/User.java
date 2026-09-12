package com.ecommerce.entity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    int id;
    String email;
    String password;
    String firstName;
    String lastName;
    String phone;
    LocalDate dateOfBirth;
    String avatar;
    int status;
    int isDelete;

}

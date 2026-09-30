package com.example.CountrySearch;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository 
public interface PaisRepository extends JpaRepository<Pais, Integer> {
   
    Optional<Pais> findByNome(String nome);

    List<Pais> findByContinente(String continente);

    List<Pais> findByNomeContainingIgnoreCaseOrCapitalContainingIgnoreCase(String nome, String capital);
}

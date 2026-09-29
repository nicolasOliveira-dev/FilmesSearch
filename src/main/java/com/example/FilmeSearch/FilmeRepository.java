package com.example.FilmeSearch;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository 
public interface FilmeRepository extends JpaRepository<Filme, Integer> {
   
    Optional<Filme> findByNome(String nome);

    List<Filme> findByGenero(String genero);
}
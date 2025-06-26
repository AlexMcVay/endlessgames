package com.multigameapp.dictionary.repository;

import com.multigameapp.dictionary.entity.Word;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Word entity operations
 */
@Repository
public interface WordRepository extends JpaRepository<Word, String> {

    /**
     * Find word by exact match (case-insensitive)
     */
    Optional<Word> findByWordLowercase(String wordLowercase);

    /**
     * Check if word exists (case-insensitive)
     */
    boolean existsByWordLowercase(String wordLowercase);

    /**
     * Find words containing the search term
     */
    @Query("SELECT w FROM Word w WHERE LOWER(w.word) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY w.usageFrequency DESC")
    List<Word> findByWordContainingIgnoreCase(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Find words starting with the search term
     */
    @Query("SELECT w FROM Word w WHERE LOWER(w.word) LIKE LOWER(CONCAT(:searchTerm, '%')) ORDER BY w.usageFrequency DESC")
    List<Word> findByWordStartingWithIgnoreCase(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Find random words
     */
    @Query(value = "SELECT * FROM dictionary ORDER BY RANDOM() LIMIT :count", nativeQuery = true)
    List<Word> findRandomWords(@Param("count") int count);

    /**
     * Find random words by difficulty level
     */
    @Query(value = "SELECT * FROM dictionary WHERE difficulty_level = :difficulty ORDER BY RANDOM() LIMIT :count", nativeQuery = true)
    List<Word> findRandomWordsByDifficulty(@Param("difficulty") int difficulty, @Param("count") int count);

    /**
     * Find words by part of speech
     */
    List<Word> findByPartOfSpeechIgnoreCase(String partOfSpeech, Pageable pageable);

    /**
     * Find words by difficulty level
     */
    List<Word> findByDifficultyLevel(int difficultyLevel, Pageable pageable);

    /**
     * Find common words
     */
    List<Word> findByIsCommonTrue(Pageable pageable);

    /**
     * Find words by word length
     */
    List<Word> findByWordLength(int wordLength, Pageable pageable);

    /**
     * Find words by word length range
     */
    List<Word> findByWordLengthBetween(int minLength, int maxLength, Pageable pageable);

    /**
     * Get count of words by difficulty level
     */
    @Query("SELECT w.difficultyLevel, COUNT(w) FROM Word w GROUP BY w.difficultyLevel ORDER BY w.difficultyLevel")
    List<Object[]> countWordsByDifficultyLevel();

    /**
     * Get count of words by part of speech
     */
    @Query("SELECT w.partOfSpeech, COUNT(w) FROM Word w WHERE w.partOfSpeech IS NOT NULL GROUP BY w.partOfSpeech ORDER BY COUNT(w) DESC")
    List<Object[]> countWordsByPartOfSpeech();

    /**
     * Get total definitions count
     */
    @Query("SELECT SUM(SIZE(w.definitions)) FROM Word w")
    Long getTotalDefinitionsCount();

    /**
     * Find most frequently used words
     */
    @Query("SELECT w FROM Word w ORDER BY w.usageFrequency DESC")
    List<Word> findMostFrequentlyUsed(Pageable pageable);

    /**
     * Search words with multiple criteria
     */
    @Query("SELECT w FROM Word w WHERE " +
           "(:searchTerm IS NULL OR LOWER(w.word) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "(:partOfSpeech IS NULL OR LOWER(w.partOfSpeech) = LOWER(:partOfSpeech)) AND " +
           "(:difficulty IS NULL OR w.difficultyLevel = :difficulty) AND " +
           "(:minLength IS NULL OR w.wordLength >= :minLength) AND " +
           "(:maxLength IS NULL OR w.wordLength <= :maxLength) AND " +
           "(:isCommon IS NULL OR w.isCommon = :isCommon) " +
           "ORDER BY w.usageFrequency DESC")
    Page<Word> findWordsByCriteria(
            @Param("searchTerm") String searchTerm,
            @Param("partOfSpeech") String partOfSpeech,
            @Param("difficulty") Integer difficulty,
            @Param("minLength") Integer minLength,
            @Param("maxLength") Integer maxLength,
            @Param("isCommon") Boolean isCommon,
            Pageable pageable
    );
}

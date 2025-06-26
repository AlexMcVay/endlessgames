package com.multigameapp.dictionary.service;

import com.multigameapp.dictionary.dto.*;
import com.multigameapp.dictionary.entity.Word;
import com.multigameapp.dictionary.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Enhanced Dictionary Service
 * Provides comprehensive dictionary functionality with caching and external API integration
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EnhancedDictionaryService {

    private final WordRepository wordRepository;
    private final RestTemplate restTemplate;
    
    private static final String DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
    private static final int MAX_SEARCH_RESULTS = 100;
    private static final int MAX_RANDOM_WORDS = 50;

    /**
     * Get word definition with caching
     */
    @Cacheable(value = "wordDefinitions", key = "#word.toLowerCase()")
    public Optional<WordDto> getWordDefinition(String word) {
        log.debug("Looking up word: {}", word);
        
        Optional<Word> wordEntity = wordRepository.findByWordIgnoreCase(word);
        
        if (wordEntity.isPresent()) {
            return Optional.of(convertToDto(wordEntity.get()));
        }
        
        // If not found in database, try to fetch from external API
        return fetchAndStoreFromExternalAPI(word);
    }

    /**
     * Search words with multiple criteria
     */
    @Cacheable(value = "wordSearches", key = "#query + '_' + #limit + '_' + #exact")
    public WordSearchDto searchWords(String query, int limit, boolean exact) {
        log.debug("Searching words: query={}, limit={}, exact={}", query, limit, exact);
        
        limit = Math.min(limit, MAX_SEARCH_RESULTS);
        Pageable pageable = PageRequest.of(0, limit, Sort.by("frequencyRank", "word"));
        
        List<Word> words;
        
        if (exact) {
            words = wordRepository.findByWordIgnoreCaseOrderByFrequencyRankAscWordAsc(query, pageable);
        } else {
            // Use fuzzy search with multiple strategies
            words = performFuzzySearch(query, limit);
        }
        
        List<String> wordStrings = words.stream()
                .map(Word::getWord)
                .collect(Collectors.toList());
        
        return WordSearchDto.builder()
                .query(query)
                .count(wordStrings.size())
                .exactMatch(exact)
                .words(wordStrings)
                .build();
    }

    /**
     * Get random words with filters
     */
    @Cacheable(value = "randomWords", key = "#count + '_' + #difficulty + '_' + #partOfSpeech + '_' + #commonOnly")
    public WordSearchDto getRandomWords(int count, Integer difficulty, String partOfSpeech, boolean commonOnly) {
        log.debug("Getting random words: count={}, difficulty={}, partOfSpeech={}, commonOnly={}", 
                  count, difficulty, partOfSpeech, commonOnly);
        
        count = Math.min(count, MAX_RANDOM_WORDS);
        
        List<Word> words = wordRepository.findRandomWords(count, difficulty, partOfSpeech, commonOnly);
        
        List<WordDto> wordDtos = words.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return WordSearchDto.builder()
                .count(wordDtos.size())
                .wordDetails(wordDtos)
                .build();
    }

    /**
     * Advanced search with multiple criteria
     */
    public WordSearchDto advancedSearch(AdvancedSearchDto searchCriteria) {
        log.debug("Advanced search with criteria: {}", searchCriteria);
        
        Pageable pageable = PageRequest.of(0, 
                Math.min(searchCriteria.getLimit(), MAX_SEARCH_RESULTS), 
                Sort.by("frequencyRank", "word"));
        
        Page<Word> wordPage = wordRepository.findByAdvancedCriteria(
                searchCriteria.getQuery(),
                searchCriteria.getPartOfSpeech(),
                searchCriteria.getDifficultyLevel(),
                searchCriteria.getMinLength(),
                searchCriteria.getMaxLength(),
                searchCriteria.isCommonOnly(),
                searchCriteria.getCategory(),
                pageable
        );
        
        List<WordDto> wordDtos = wordPage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return WordSearchDto.builder()
                .count(wordDtos.size())
                .totalCount((int) wordPage.getTotalElements())
                .wordDetails(wordDtos)
                .build();
    }

    /**
     * Get words by category
     */
    @Cacheable(value = "wordsByCategory", key = "#category + '_' + #limit")
    public WordSearchDto getWordsByCategory(String category, int limit) {
        log.debug("Getting words by category: {}", category);
        
        limit = Math.min(limit, MAX_SEARCH_RESULTS);
        Pageable pageable = PageRequest.of(0, limit, Sort.by("frequencyRank", "word"));
        
        List<Word> words = wordRepository.findByCategory(category, pageable);
        
        List<WordDto> wordDtos = words.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return WordSearchDto.builder()
                .count(wordDtos.size())
                .wordDetails(wordDtos)
                .build();
    }

    /**
     * Get word of the day
     */
    @Cacheable(value = "wordOfTheDay", key = "'daily_' + T(java.time.LocalDate).now()")
    public Optional<WordDto> getWordOfTheDay() {
        return wordRepository.findWordOfTheDay()
                .map(this::convertToDto);
    }

    /**
     * Get comprehensive database statistics
     */
    @Cacheable(value = "dictionaryStats", key = "'stats_' + T(java.time.LocalDate).now()")
    public DictionaryStatsDto getDictionaryStatistics() {
        log.debug("Getting dictionary statistics");
        
        return DictionaryStatsDto.builder()
                .totalWords(wordRepository.count())
                .wordsWithDefinitions(wordRepository.countWordsWithDefinitions())
                .commonWords(wordRepository.countByIsCommonTrue())
                .difficultWords(wordRepository.countByDifficultyLevelGreaterThanEqual(7))
                .wordsByPartOfSpeech(getWordCountByPartOfSpeech())
                .wordsByDifficulty(getWordCountByDifficulty())
                .averageWordLength(wordRepository.getAverageWordLength())
                .longestWord(wordRepository.findLongestWord())
                .newestWords(getRecentlyAddedWords(10))
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    /**
     * Add or update a word (for admin functionality)
     */
    @Transactional
    public WordDto addOrUpdateWord(CreateWordDto createWordDto) {
        log.info("Adding/updating word: {}", createWordDto.getWord());
        
        Word word = wordRepository.findByWordIgnoreCase(createWordDto.getWord())
                .orElse(new Word());
        
        // Map DTO to entity
        word.setWord(createWordDto.getWord());
        word.setDefinitions(createWordDto.getDefinitions());
        word.setPhonetic(createWordDto.getPhonetic());
        word.setPartOfSpeech(createWordDto.getPartOfSpeech());
        word.setExample(createWordDto.getExample());
        word.setEtymology(createWordDto.getEtymology());
        word.setDifficultyLevel(createWordDto.getDifficultyLevel());
        word.setIsCommon(createWordDto.isCommon());
        
        if (word.getId() == null) {
            word.setCreatedAt(LocalDateTime.now());
        }
        word.setUpdatedAt(LocalDateTime.now());
        
        Word savedWord = wordRepository.save(word);
        return convertToDto(savedWord);
    }

    /**
     * Get similar words (synonyms, related words)
     */
    @Cacheable(value = "similarWords", key = "#word.toLowerCase() + '_' + #limit")
    public List<String> getSimilarWords(String word, int limit) {
        log.debug("Getting similar words for: {}", word);
        
        // This could be enhanced with a proper similarity algorithm
        // For now, using simple pattern matching
        return wordRepository.findSimilarWords(word, PageRequest.of(0, limit))
                .stream()
                .map(Word::getWord)
                .collect(Collectors.toList());
    }

    /**
     * Get word frequency and usage statistics
     */
    public WordUsageStatsDto getWordUsageStats(String word) {
        Optional<Word> wordEntity = wordRepository.findByWordIgnoreCase(word);
        
        if (wordEntity.isPresent()) {
            Word w = wordEntity.get();
            return WordUsageStatsDto.builder()
                    .word(w.getWord())
                    .frequencyRank(w.getFrequencyRank())
                    .isCommon(w.getIsCommon())
                    .difficultyLevel(w.getDifficultyLevel())
                    .wordLength(w.getWord().length())
                    .partOfSpeech(w.getPartOfSpeech())
                    .build();
        }
        
        return null;
    }

    // Private helper methods

    private List<Word> performFuzzySearch(String query, int limit) {
        List<Word> results = new ArrayList<>();
        
        // Strategy 1: Starts with query
        results.addAll(wordRepository.findByWordStartingWithIgnoreCase(
                query, PageRequest.of(0, limit / 3)));
        
        // Strategy 2: Contains query
        if (results.size() < limit) {
            results.addAll(wordRepository.findByWordContainingIgnoreCase(
                    query, PageRequest.of(0, limit - results.size())));
        }
        
        // Strategy 3: Phonetic similarity (if available)
        if (results.size() < limit) {
            results.addAll(wordRepository.findByPhoneticSimilarity(
                    query, PageRequest.of(0, limit - results.size())));
        }
        
        // Remove duplicates and maintain order
        return results.stream()
                .distinct()
                .limit(limit)
                .collect(Collectors.toList());
    }

    private Optional<WordDto> fetchAndStoreFromExternalAPI(String word) {
        try {
            log.debug("Fetching word from external API: {}", word);
            
            // Call external dictionary API
            ExternalApiResponse[] responses = restTemplate.getForObject(
                    DICTIONARY_API_URL + word.toLowerCase(), 
                    ExternalApiResponse[].class
            );
            
            if (responses != null && responses.length > 0) {
                ExternalApiResponse response = responses[0];
                
                // Convert to our entity and save
                Word newWord = convertExternalResponseToEntity(response);
                Word savedWord = wordRepository.save(newWord);
                
                return Optional.of(convertToDto(savedWord));
            }
            
        } catch (Exception e) {
            log.warn("Failed to fetch word from external API: {}", word, e);
        }
        
        return Optional.empty();
    }

    private Word convertExternalResponseToEntity(ExternalApiResponse response) {
        Word word = new Word();
        word.setWord(response.getWord());
        word.setPhonetic(response.getPhonetic());
        
        // Extract definitions and other data from meanings
        List<String> definitions = new ArrayList<>();
        String partOfSpeech = "";
        String example = "";
        
        if (response.getMeanings() != null && !response.getMeanings().isEmpty()) {
            ExternalApiResponse.Meaning firstMeaning = response.getMeanings().get(0);
            partOfSpeech = firstMeaning.getPartOfSpeech();
            
            if (firstMeaning.getDefinitions() != null) {
                for (ExternalApiResponse.Definition def : firstMeaning.getDefinitions()) {
                    definitions.add(def.getDefinition());
                    if (example.isEmpty() && def.getExample() != null) {
                        example = def.getExample();
                    }
                }
            }
        }
        
        word.setDefinitions(definitions);
        word.setPartOfSpeech(partOfSpeech);
        word.setExample(example);
        word.setDifficultyLevel(calculateDifficultyLevel(response.getWord(), definitions));
        word.setIsCommon(isCommonWord(response.getWord()));
        word.setCreatedAt(LocalDateTime.now());
        word.setUpdatedAt(LocalDateTime.now());
        
        return word;
    }

    private int calculateDifficultyLevel(String word, List<String> definitions) {
        // Simple heuristic based on word length and definition complexity
        int baseLevel = Math.min(word.length() / 2, 5);
        
        if (definitions != null && !definitions.isEmpty()) {
            double avgDefinitionLength = definitions.stream()
                    .mapToInt(String::length)
                    .average()
                    .orElse(50.0);
            
            if (avgDefinitionLength > 100) baseLevel += 2;
            else if (avgDefinitionLength > 50) baseLevel += 1;
        }
        
        return Math.max(1, Math.min(baseLevel, 10));
    }

    private boolean isCommonWord(String word) {
        // List of most common English words
        Set<String> commonWords = Set.of(
                "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
                "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
                "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
                "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
                "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
                "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
                "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
                "new", "want", "because", "any", "these", "give", "day", "most", "us"
        );
        
        return commonWords.contains(word.toLowerCase());
    }

    private WordDto convertToDto(Word word) {
        return WordDto.builder()
                .word(word.getWord())
                .definitions(word.getDefinitions())
                .phonetic(word.getPhonetic())
                .partOfSpeech(word.getPartOfSpeech())
                .example(word.getExample())
                .etymology(word.getEtymology())
                .difficultyLevel(word.getDifficultyLevel())
                .isCommon(word.getIsCommon())
                .frequencyRank(word.getFrequencyRank())
                .createdAt(word.getCreatedAt())
                .build();
    }

    private Map<String, Long> getWordCountByPartOfSpeech() {
        return wordRepository.countByPartOfSpeech()
                .stream()
                .collect(Collectors.toMap(
                        result -> (String) result[0],
                        result -> (Long) result[1]
                ));
    }

    private Map<Integer, Long> getWordCountByDifficulty() {
        return wordRepository.countByDifficultyLevel()
                .stream()
                .collect(Collectors.toMap(
                        result -> (Integer) result[0],
                        result -> (Long) result[1]
                ));
    }

    private List<String> getRecentlyAddedWords(int limit) {
        return wordRepository.findRecentlyAdded(PageRequest.of(0, limit))
                .stream()
                .map(Word::getWord)
                .collect(Collectors.toList());
    }

    // DTO classes for external API response
    @lombok.Data
    private static class ExternalApiResponse {
        private String word;
        private String phonetic;
        private List<Meaning> meanings;

        @lombok.Data
        public static class Meaning {
            private String partOfSpeech;
            private List<Definition> definitions;

            @lombok.Data
            public static class Definition {
                private String definition;
                private String example;
            }
        }
    }
}

package com.multigameapp.dictionary.service;

import com.multigameapp.dictionary.dto.*;
import com.multigameapp.dictionary.entity.Word;
import com.multigameapp.dictionary.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service class for dictionary operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DictionaryService {

    private final WordRepository wordRepository;
    private final ModelMapper modelMapper;
    private final WebClient webClient;

    private static final String EXTERNAL_DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";

    /**
     * Get word definition by word
     */
    @Cacheable(value = "words", key = "#word.toLowerCase()")
    public Optional<WordDto> getWordDefinition(String word) {
        log.info("Getting definition for word: {}", word);
        
        Optional<Word> wordEntity = wordRepository.findByWordLowercase(word.toLowerCase());
        
        if (wordEntity.isPresent()) {
            // Update usage frequency
            updateUsageFrequency(wordEntity.get());
            return Optional.of(convertToDto(wordEntity.get()));
        }
        
        // If not found, try to fetch from external API
        return fetchFromExternalApi(word);
    }

    /**
     * Search words by pattern
     */
    public WordSearchDto searchWords(String query, int limit) {
        log.info("Searching words with query: {}, limit: {}", query, limit);
        
        Pageable pageable = PageRequest.of(0, Math.min(limit, 100));
        List<Word> words = wordRepository.findByWordContainingIgnoreCase(query, pageable);
        
        List<WordDto> wordDtos = words.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return WordSearchDto.builder()
                .query(query)
                .count(wordDtos.size())
                .words(wordDtos)
                .build();
    }

    /**
     * Get random words
     */
    @Cacheable(value = "randomWords", key = "#count + '_' + #difficulty")
    public WordSearchDto getRandomWords(int count, Integer difficulty) {
        log.info("Getting {} random words with difficulty: {}", count, difficulty);
        
        List<Word> words;
        if (difficulty != null) {
            words = wordRepository.findRandomWordsByDifficulty(difficulty, Math.min(count, 50));
        } else {
            words = wordRepository.findRandomWords(Math.min(count, 50));
        }
        
        List<WordDto> wordDtos = words.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return WordSearchDto.builder()
                .count(wordDtos.size())
                .words(wordDtos)
                .build();
    }

    /**
     * Get dictionary statistics
     */
    @Cacheable(value = "stats")
    public DictionaryStatsDto getDictionaryStats() {
        log.info("Getting dictionary statistics");
        
        long totalWords = wordRepository.count();
        long totalDefinitions = Optional.ofNullable(wordRepository.getTotalDefinitionsCount()).orElse(0L);
        long commonWordsCount = wordRepository.findByIsCommonTrue(PageRequest.of(0, Integer.MAX_VALUE)).size();
        
        double avgDefinitionsPerWord = totalWords > 0 ? (double) totalDefinitions / totalWords : 0.0;
        
        List<DictionaryStatsDto.DifficultyStats> difficultyStats = wordRepository.countWordsByDifficultyLevel()
                .stream()
                .map(row -> new DictionaryStatsDto.DifficultyStats((Integer) row[0], (Long) row[1]))
                .collect(Collectors.toList());
        
        List<DictionaryStatsDto.PartOfSpeechStats> posStats = wordRepository.countWordsByPartOfSpeech()
                .stream()
                .limit(10)
                .map(row -> new DictionaryStatsDto.PartOfSpeechStats((String) row[0], (Long) row[1]))
                .collect(Collectors.toList());
        
        return DictionaryStatsDto.builder()
                .totalWords(totalWords)
                .totalDefinitions(totalDefinitions)
                .avgDefinitionsPerWord(avgDefinitionsPerWord)
                .commonWordsCount(commonWordsCount)
                .wordsByDifficulty(difficultyStats)
                .topPartsOfSpeech(posStats)
                .build();
    }

    /**
     * Add new word to dictionary
     */
    @Transactional
    public Optional<WordDto> addWord(String word) {
        log.info("Adding new word: {}", word);
        
        // Check if word already exists
        if (wordRepository.existsByWordLowercase(word.toLowerCase())) {
            log.warn("Word already exists: {}", word);
            return Optional.empty();
        }
        
        // Try to fetch from external API
        return fetchFromExternalApi(word);
    }

    /**
     * Search words with multiple criteria
     */
    public Page<WordDto> searchWordsByCriteria(
            String searchTerm, String partOfSpeech, Integer difficulty,
            Integer minLength, Integer maxLength, Boolean isCommon,
            int page, int size) {
        
        log.info("Searching words with criteria - term: {}, pos: {}, difficulty: {}, minLength: {}, maxLength: {}, isCommon: {}",
                searchTerm, partOfSpeech, difficulty, minLength, maxLength, isCommon);
        
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<Word> words = wordRepository.findWordsByCriteria(
                searchTerm, partOfSpeech, difficulty, minLength, maxLength, isCommon, pageable);
        
        return words.map(this::convertToDto);
    }

    /**
     * Fetch word definition from external API
     */
    private Optional<WordDto> fetchFromExternalApi(String word) {
        try {
            log.info("Fetching word from external API: {}", word);
            
            ExternalDictionaryResponseDto[] response = webClient
                    .get()
                    .uri(EXTERNAL_DICTIONARY_API + word.toLowerCase())
                    .retrieve()
                    .bodyToMono(ExternalDictionaryResponseDto[].class)
                    .block();
            
            if (response != null && response.length > 0) {
                ExternalDictionaryResponseDto entry = response[0];
                
                // Extract definitions and other data
                List<String> definitions = entry.getMeanings().stream()
                        .flatMap(meaning -> meaning.getDefinitions().stream())
                        .map(ExternalDictionaryResponseDto.DefinitionDto::getDefinition)
                        .distinct()
                        .collect(Collectors.toList());
                
                String partOfSpeech = entry.getMeanings().isEmpty() ? null : 
                        entry.getMeanings().get(0).getPartOfSpeech();
                
                String example = entry.getMeanings().stream()
                        .flatMap(meaning -> meaning.getDefinitions().stream())
                        .filter(def -> def.getExample() != null)
                        .map(ExternalDictionaryResponseDto.DefinitionDto::getExample)
                        .findFirst()
                        .orElse(null);
                
                // Create and save word entity
                Word wordEntity = Word.builder()
                        .word(word.toLowerCase())
                        .definitions(definitions)
                        .phonetic(entry.getPhonetic())
                        .partOfSpeech(partOfSpeech)
                        .example(example)
                        .difficultyLevel(calculateDifficultyLevel(word, definitions))
                        .isCommon(isCommonWord(word))
                        .usageFrequency(1)
                        .build();
                
                Word savedWord = wordRepository.save(wordEntity);
                log.info("Saved new word: {}", savedWord.getWord());
                
                return Optional.of(convertToDto(savedWord));
            }
            
        } catch (Exception e) {
            log.error("Error fetching word from external API: {}", e.getMessage());
        }
        
        return Optional.empty();
    }

    /**
     * Update usage frequency of a word
     */
    @Transactional
    private void updateUsageFrequency(Word word) {
        word.setUsageFrequency(word.getUsageFrequency() + 1);
        wordRepository.save(word);
    }

    /**
     * Calculate difficulty level based on word characteristics
     */
    private Integer calculateDifficultyLevel(String word, List<String> definitions) {
        int difficulty = 1;
        
        // Base difficulty on word length
        if (word.length() > 8) difficulty += 2;
        else if (word.length() > 6) difficulty += 1;
        
        // Increase difficulty based on number of syllables (rough estimate)
        int syllables = countSyllables(word);
        if (syllables > 3) difficulty += 2;
        else if (syllables > 2) difficulty += 1;
        
        // Check for complex definitions
        if (definitions.stream().anyMatch(def -> def.length() > 100)) {
            difficulty += 1;
        }
        
        return Math.min(difficulty, 10);
    }

    /**
     * Rough syllable counting for difficulty calculation
     */
    private int countSyllables(String word) {
        word = word.toLowerCase();
        int syllables = 0;
        boolean previousWasVowel = false;
        
        for (int i = 0; i < word.length(); i++) {
            char c = word.charAt(i);
            boolean isVowel = "aeiouy".indexOf(c) >= 0;
            
            if (isVowel && !previousWasVowel) {
                syllables++;
            }
            previousWasVowel = isVowel;
        }
        
        // Handle silent 'e'
        if (word.endsWith("e") && syllables > 1) {
            syllables--;
        }
        
        return Math.max(syllables, 1);
    }

    /**
     * Determine if word is common based on length and characteristics
     */
    private Boolean isCommonWord(String word) {
        // Simple heuristic: shorter words are more likely to be common
        return word.length() <= 6;
    }

    /**
     * Convert Word entity to DTO
     */
    private WordDto convertToDto(Word word) {
        return modelMapper.map(word, WordDto.class);
    }
}

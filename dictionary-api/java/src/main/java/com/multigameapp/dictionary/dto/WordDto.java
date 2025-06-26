package com.multigameapp.dictionary.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Data Transfer Object for Word entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WordDto {
    
    private String word;
    
    private List<String> definitions;
    
    private String phonetic;
    
    @JsonProperty("part_of_speech")
    private String partOfSpeech;
    
    private String example;
    
    private String etymology;
    
    @JsonProperty("difficulty_level")
    private Integer difficultyLevel;
    
    @JsonProperty("word_length")
    private Integer wordLength;
    
    @JsonProperty("is_common")
    private Boolean isCommon;
    
    @JsonProperty("usage_frequency")
    private Integer usageFrequency;
}

/**
 * Response wrapper for API responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String timestamp;
    
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(java.time.LocalDateTime.now().toString())
                .build();
    }
    
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(java.time.LocalDateTime.now().toString())
                .build();
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(java.time.LocalDateTime.now().toString())
                .build();
    }
}

/**
 * DTO for word search results
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class WordSearchDto {
    private String query;
    private int count;
    private List<WordDto> words;
}

/**
 * DTO for dictionary statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class DictionaryStatsDto {
    @JsonProperty("total_words")
    private long totalWords;
    
    @JsonProperty("total_definitions")
    private long totalDefinitions;
    
    @JsonProperty("avg_definitions_per_word")
    private double avgDefinitionsPerWord;
    
    @JsonProperty("common_words_count")
    private long commonWordsCount;
    
    @JsonProperty("words_by_difficulty")
    private List<DifficultyStats> wordsByDifficulty;
    
    @JsonProperty("top_parts_of_speech")
    private List<PartOfSpeechStats> topPartsOfSpeech;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DifficultyStats {
        private int difficulty;
        private long count;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartOfSpeechStats {
        @JsonProperty("part_of_speech")
        private String partOfSpeech;
        private long count;
    }
}

/**
 * DTO for adding new words
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class AddWordRequestDto {
    private String word;
}

/**
 * DTO for external dictionary API response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class ExternalDictionaryResponseDto {
    private String word;
    private String phonetic;
    private List<MeaningDto> meanings;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MeaningDto {
        private String partOfSpeech;
        private List<DefinitionDto> definitions;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DefinitionDto {
        private String definition;
        private String example;
    }
}

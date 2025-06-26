package com.multigameapp.dictionary.controller;

import com.multigameapp.dictionary.dto.*;
import com.multigameapp.dictionary.service.DictionaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST Controller for Dictionary API
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dictionary API", description = "English Dictionary API for MultigameApp")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DictionaryController {

    private final DictionaryService dictionaryService;

    @GetMapping("/")
    @Operation(summary = "API Documentation", description = "Get API information and endpoints")
    public ResponseEntity<ApiResponse<ApiInfo>> getApiInfo() {
        ApiInfo apiInfo = ApiInfo.builder()
                .name("Dictionary API for MultigameApp")
                .version("1.0.0")
                .description("English Dictionary API providing word definitions, search, and statistics")
                .endpoints(ApiEndpoints.builder()
                        .wordLookup("/api/word/{word}")
                        .wordSearch("/api/search")
                        .randomWords("/api/random")
                        .statistics("/api/stats")
                        .addWord("/api/add-word")
                        .advancedSearch("/api/search/advanced")
                        .build())
                .build();

        return ResponseEntity.ok(ApiResponse.success(apiInfo));
    }

    @GetMapping("/word/{word}")
    @Operation(summary = "Get Word Definition", description = "Get detailed definition for a specific word")
    public ResponseEntity<ApiResponse<WordDto>> getWordDefinition(
            @Parameter(description = "Word to look up", example = "beautiful")
            @PathVariable String word) {
        
        log.info("Request for word definition: {}", word);
        
        if (word == null || word.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Word parameter is required"));
        }

        Optional<WordDto> wordDto = dictionaryService.getWordDefinition(word.trim());
        
        if (wordDto.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(wordDto.get()));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Word '" + word + "' not found"));
        }
    }

    @GetMapping("/search")
    @Operation(summary = "Search Words", description = "Search for words matching a pattern")
    public ResponseEntity<ApiResponse<WordSearchDto>> searchWords(
            @Parameter(description = "Search query (minimum 2 characters)", example = "beau")
            @RequestParam String q,
            @Parameter(description = "Maximum results (default: 50, max: 100)", example = "20")
            @RequestParam(defaultValue = "50") int limit) {
        
        log.info("Search request for query: {}, limit: {}", q, limit);
        
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Query must be at least 2 characters long"));
        }

        WordSearchDto results = dictionaryService.searchWords(q.trim(), limit);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/random")
    @Operation(summary = "Get Random Words", description = "Get random words from the dictionary")
    public ResponseEntity<ApiResponse<WordSearchDto>> getRandomWords(
            @Parameter(description = "Number of words to return (default: 10, max: 50)", example = "15")
            @RequestParam(defaultValue = "10") int count,
            @Parameter(description = "Filter by difficulty level (1-10)", example = "3")
            @RequestParam(required = false) Integer difficulty) {
        
        log.info("Random words request - count: {}, difficulty: {}", count, difficulty);
        
        if (count < 1 || count > 50) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Count must be between 1 and 50"));
        }
        
        if (difficulty != null && (difficulty < 1 || difficulty > 10)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Difficulty must be between 1 and 10"));
        }

        WordSearchDto results = dictionaryService.getRandomWords(count, difficulty);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get Dictionary Statistics", description = "Get comprehensive dictionary statistics")
    public ResponseEntity<ApiResponse<DictionaryStatsDto>> getDictionaryStats() {
        log.info("Statistics request");
        
        DictionaryStatsDto stats = dictionaryService.getDictionaryStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PostMapping("/add-word")
    @Operation(summary = "Add New Word", description = "Add a new word to the dictionary")
    public ResponseEntity<ApiResponse<WordDto>> addWord(
            @RequestBody AddWordRequestDto request) {
        
        log.info("Add word request: {}", request.getWord());
        
        if (request.getWord() == null || request.getWord().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Word is required"));
        }

        Optional<WordDto> wordDto = dictionaryService.addWord(request.getWord().trim());
        
        if (wordDto.isPresent()) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(wordDto.get(), "Word '" + request.getWord() + "' added successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Word '" + request.getWord() + "' already exists or could not be found"));
        }
    }

    @GetMapping("/search/advanced")
    @Operation(summary = "Advanced Word Search", description = "Search words with multiple criteria")
    public ResponseEntity<ApiResponse<Page<WordDto>>> advancedSearch(
            @Parameter(description = "Search term") @RequestParam(required = false) String q,
            @Parameter(description = "Part of speech") @RequestParam(required = false) String pos,
            @Parameter(description = "Difficulty level (1-10)") @RequestParam(required = false) Integer difficulty,
            @Parameter(description = "Minimum word length") @RequestParam(required = false) Integer minLength,
            @Parameter(description = "Maximum word length") @RequestParam(required = false) Integer maxLength,
            @Parameter(description = "Filter common words only") @RequestParam(required = false) Boolean common,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (max 100)") @RequestParam(defaultValue = "20") int size) {
        
        log.info("Advanced search - q: {}, pos: {}, difficulty: {}, page: {}, size: {}", 
                q, pos, difficulty, page, size);
        
        if (size > 100) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Page size cannot exceed 100"));
        }

        Page<WordDto> results = dictionaryService.searchWordsByCriteria(
                q, pos, difficulty, minLength, maxLength, common, page, size);
        
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    // Exception handler for general exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Unexpected error: ", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal server error: " + e.getMessage()));
    }
}

// Supporting DTOs for API documentation
@lombok.Data
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
@lombok.Builder
class ApiInfo {
    private String name;
    private String version;
    private String description;
    private ApiEndpoints endpoints;
}

@lombok.Data
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
@lombok.Builder
class ApiEndpoints {
    private String wordLookup;
    private String wordSearch;
    private String randomWords;
    private String statistics;
    private String addWord;
    private String advancedSearch;
}

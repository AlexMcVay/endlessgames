package com.multigameapp.dictionary.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity representing a word in the dictionary
 */
@Entity
@Table(name = "dictionary")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Word {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @Column(name = "word", nullable = false, unique = true, length = 100)
    private String word;

    @Column(name = "word_lowercase", nullable = false, length = 100)
    private String wordLowercase;

    @ElementCollection
    @CollectionTable(name = "word_definitions", joinColumns = @JoinColumn(name = "word_id"))
    @Column(name = "definition", columnDefinition = "TEXT")
    private List<String> definitions;

    @Column(name = "phonetic", length = 200)
    private String phonetic;

    @Column(name = "part_of_speech", length = 50)
    @JsonProperty("part_of_speech")
    private String partOfSpeech;

    @Column(name = "example", columnDefinition = "TEXT")
    private String example;

    @Column(name = "etymology", columnDefinition = "TEXT")
    private String etymology;

    @Column(name = "difficulty_level")
    @Builder.Default
    private Integer difficultyLevel = 1;

    @Column(name = "word_length")
    private Integer wordLength;

    @Column(name = "is_common")
    @Builder.Default
    private Boolean isCommon = false;

    @Column(name = "usage_frequency")
    @Builder.Default
    private Integer usageFrequency = 0;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        this.wordLowercase = this.word != null ? this.word.toLowerCase() : null;
        this.wordLength = this.word != null ? this.word.length() : 0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.wordLowercase = this.word != null ? this.word.toLowerCase() : null;
        this.wordLength = this.word != null ? this.word.length() : 0;
        this.updatedAt = LocalDateTime.now();
    }
}

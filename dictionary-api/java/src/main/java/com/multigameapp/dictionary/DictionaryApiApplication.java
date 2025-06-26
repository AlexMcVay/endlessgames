package com.multigameapp.dictionary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Main application class for the Dictionary API
 * Provides English dictionary functionality for MultigameApp
 */
@SpringBootApplication
@EnableCaching
public class DictionaryApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(DictionaryApiApplication.class, args);
    }
}

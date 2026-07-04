package com.interviewmirror.backend.service;

import org.springframework.stereotype.Service;

@Service
public class OllamaService {
    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
    private static final String OLLAMA_URL = "http://localhost:11434/api/generate";

    public String generateQuestion(String prompt) {
        java.util.Map<String, Object> requestBody = new java.util.HashMap<>();

        requestBody.put("model", "gemma3:4b");
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);
        java.util.Map response = restTemplate.postForObject(
        OLLAMA_URL,
        requestBody,
        java.util.Map.class
);

return response.get("response").toString();
    }
}
package com.fascinito.pos.dto.product;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Custom deserializer to handle imageUrls that can come as either:
 * 1. A JSON array directly: ["url1", "url2"]
 * 2. A JSON string containing an array: "[\"url1\", \"url2\"]"
 * 3. null
 */
public class JsonStringToListDeserializer extends JsonDeserializer<List<String>> {

    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public List<String> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        // Handle null case
        if (p.currentToken() == null) {
            return new ArrayList<>();
        }

        try {
            // Try to get the value as text
            String value = p.getValueAsString();

            // If it's null or empty, return empty list
            if (value == null || value.trim().isEmpty()) {
                return new ArrayList<>();
            }

            // Check if it's a JSON string (starts with "[")
            if (value.trim().startsWith("[")) {
                // It's a JSON string, parse it
                return mapper.readValue(value, new TypeReference<List<String>>() {});
            } else if (value.trim().startsWith("\"")) {
                // It might be a single quoted string, try to parse as array
                try {
                    return mapper.readValue(value, new TypeReference<List<String>>() {});
                } catch (Exception e) {
                    // If parsing fails, return as single-item list
                    List<String> list = new ArrayList<>();
                    list.add(value.replaceAll("^\"|\"$", "")); // Remove quotes
                    return list;
                }
            } else {
                // It's a plain string, return as single-item list
                List<String> list = new ArrayList<>();
                list.add(value);
                return list;
            }
        } catch (Exception e) {
            // If all parsing fails, return empty list
            return new ArrayList<>();
        }
    }
}

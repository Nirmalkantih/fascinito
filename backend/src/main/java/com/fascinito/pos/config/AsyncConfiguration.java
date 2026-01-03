package com.fascinito.pos.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@Slf4j
public class AsyncConfiguration {

    /**
     * Configure a thread pool executor for async email campaign processing
     * This allows multiple campaigns to be processed in parallel
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);  // Core threads always kept running
        executor.setMaxPoolSize(10);  // Max threads when needed
        executor.setQueueCapacity(100);  // Queue size for pending tasks
        executor.setThreadNamePrefix("email-campaign-");
        executor.initialize();

        log.info("Email campaign thread pool configured: corePoolSize=5, maxPoolSize=10, queueCapacity=100");

        return executor;
    }
}

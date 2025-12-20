# Performance Testing & Benchmarking Guide

**Version**: 1.0
**Date**: December 2024
**Status**: Ready for Testing

---

## Overview

This guide provides instructions for testing and benchmarking the performance improvements made through database indexing and query optimization.

---

## Part 1: Deployment Steps

### Step 1: Verify Database Migration

Before starting the application:

```bash
# Check if migration file exists
ls -la backend/src/main/resources/db/migration/

# Output should show:
# V1__add_performance_indexes.sql
```

### Step 2: Start Application

The Flyway migration will run automatically on startup:

```bash
# Start backend
./mvnw spring-boot:run

# Watch for log messages:
# Flyway is loading migrations from: classpath:db/migration
# Migrating schema "public" to version "1"
# Successfully validated 1 migration (execution time 00m:00.000s)
```

### Step 3: Verify Index Creation

Connect to PostgreSQL and verify indexes were created:

```bash
# Connect to database
psql -U postgres -d pos_db

# List indexes on products table
\d products

# Or use this query:
SELECT indexname FROM pg_indexes WHERE tablename = 'products';

# Expected output (at least these):
# idx_product_active_visible
# idx_product_category_id
# idx_product_vendor_id
# idx_product_featured
# idx_product_slug
# idx_product_sku
```

---

## Part 2: Performance Testing

### Test Setup

**Assumptions:**
- Backend running on `http://localhost:8080`
- PostgreSQL with 1000+ products in database
- Same network conditions for all tests

**Tools Needed:**
- Apache JMeter or Postman (for API testing)
- PostgreSQL client
- curl or Insomnia (for manual testing)

### Test 1: Product Listing - Query Performance

**Objective**: Measure API response time for product listing

**Steps:**

1. **Baseline Test (Before Optimizations)**
   ```bash
   # Manual test - Single request
   time curl -s "http://localhost:8080/api/products?page=0&size=12&active=true&visibleToCustomers=true" | jq '.' > /dev/null

   # Expected time before: 1500-3000ms
   ```

2. **Optimized Test (After Optimizations)**
   ```bash
   # The same request should now be faster
   time curl -s "http://localhost:8080/api/products?page=0&size=12&active=true&visibleToCustomers=true" | jq '.' > /dev/null

   # Expected time after: 300-500ms
   ```

3. **JMeter Load Test**
   - Create a JMeter test plan
   - HTTP Request: `GET http://localhost:8080/api/products?page=0&size=12&active=true&visibleToCustomers=true`
   - Number of threads: 10
   - Ramp-up period: 1 second
   - Loop count: 100 (1000 total requests)
   - Check response times in Summary Report

**Expected Results:**
```
Test Results:
- Average response time: <500ms (improved from 1500-3000ms)
- Min response time: <100ms
- Max response time: <1000ms
- 95th percentile: <600ms
- Error rate: 0%
```

### Test 2: Order Listing - Query Performance

**Objective**: Measure API response time for order listing by user

**Steps:**

1. **Get a valid user ID first:**
   ```bash
   # From your database
   psql -U postgres -d pos_db -c "SELECT id FROM users LIMIT 1;"

   # Store as USER_ID
   ```

2. **Test the endpoint:**
   ```bash
   time curl -s "http://localhost:8080/api/orders?page=0&size=10" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'

   # Expected time after: 250-400ms (improved from 2000-4000ms)
   ```

3. **Database Query Analysis:**
   ```sql
   -- Enable query logging
   SET log_statement = 'all';
   SET log_duration = 'on';

   -- Run the query
   SELECT * FROM orders WHERE user_id = YOUR_USER_ID LIMIT 10;

   -- Check query plan
   EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = YOUR_USER_ID LIMIT 10;

   -- Expected: Uses index idx_order_user_id_created
   ```

**Expected Results:**
```
Before Optimization:
- Query plan: Sequential Scan
- Execution time: 100-200ms
- Rows scanned: 50,000+

After Optimization:
- Query plan: Index Scan (using idx_order_user_id_created)
- Execution time: 1-5ms
- Rows scanned: 10
```

### Test 3: Database Index Effectiveness

**Objective**: Verify indexes are being used

**Steps:**

```sql
-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

**Expected Output:**
```
All our created indexes should appear with high scan counts:
- idx_product_active_visible: scans > 50
- idx_order_user_id_created: scans > 30
- idx_cart_item_user_id: scans > 20
```

### Test 4: Memory Usage

**Objective**: Measure memory improvement from batch loading

**Steps:**

1. **Monitor heap usage during test:**
   ```bash
   # Start application with memory monitoring
   jps -l  # Find Java process
   jstat -gc -h10 <pid> 1000  # Monitor every 1 second
   ```

2. **Run load test (from Test 1) while monitoring**

3. **Compare memory usage:**
   ```
   Before optimization:
   - Heap used: 400-600MB
   - GC pauses: 100-200ms

   After optimization:
   - Heap used: 300-400MB (30% reduction)
   - GC pauses: 50-100ms
   ```

---

## Part 3: Deployment Checklist

- [ ] Verify Flyway migration file exists
- [ ] Start application and watch for migration logs
- [ ] Verify all 24 indexes were created in PostgreSQL
- [ ] Run Test 1: Product Listing (should see <500ms response)
- [ ] Run Test 2: Order Listing (should see <400ms response)
- [ ] Run Test 3: Verify indexes are being used
- [ ] Run Test 4: Check memory usage improvement
- [ ] Monitor slow query log for 1 week
- [ ] Document results in Performance Benchmark Report
- [ ] Green light for production deployment

---

**Next Steps**: Run comprehensive tests and document results.

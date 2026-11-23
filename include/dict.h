#ifndef MINIKV_DICT_H
#define MINIKV_DICT_H

#include <stddef.h>
#include <stdint.h>

/* Hash table with chaining, used as the keyspace.
 * expire_at_ms is an absolute CLOCK_MONOTONIC timestamp in milliseconds;
 * 0 means "never expires". */

typedef struct kv_dict kv_dict;

kv_dict *kv_dict_create(void);
void kv_dict_free(kv_dict *d);

/* Insert or overwrite. Frees previous value if key existed. */
int kv_dict_set(kv_dict *d, const char *key, size_t klen, const char *val, size_t vlen, int64_t expire_at_ms);

/* Returns internal pointer to value (valid until next mutation), or NULL.
 * Lazily purges expired entries. */
const char *kv_dict_get(kv_dict *d, const char *key, size_t klen, size_t *vlen_out);

/* 1 if deleted, 0 if missing (or already expired). */
int kv_dict_del(kv_dict *d, const char *key, size_t klen);

int kv_dict_exists(kv_dict *d, const char *key, size_t klen);

/* Count unexpired keys (does not purge). */
size_t kv_dict_count(kv_dict *d);

/* Delete all expired entries; returns number removed. */
size_t kv_dict_sweep_expired(kv_dict *d, int64_t now_ms);

void kv_dict_flush(kv_dict *d);

/* -2 key missing, -1 no TTL set, else ms remaining. */
int64_t kv_dict_ttl_ms(kv_dict *d, const char *key, size_t klen);

/* Set/replace expiry. 1 ok, 0 key missing. */
int kv_dict_expire(kv_dict *d, const char *key, size_t klen, int64_t expire_at_ms);

#endif

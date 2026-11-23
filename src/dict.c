#include "dict.h"

#include <stdlib.h>
#include <string.h>
#include <time.h>

typedef struct dictEntry {
    char *key;
    size_t klen;
    char *val;
    size_t vlen;
    int64_t expire_at_ms; /* 0 = never */
    struct dictEntry *next;
} dictEntry;

struct kv_dict {
    dictEntry **buckets;
    size_t size;   /* bucket count, power of two */
    size_t count;  /* live (unexpired) entries */
};

static int64_t now_ms(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (int64_t)ts.tv_sec * 1000 + ts.tv_nsec / 1000000;
}

static uint64_t fnv1a(const void *data, size_t n)
{
    uint64_t h = 1469598103934665603ULL;
    const unsigned char *p = data;
    for (size_t i = 0; i < n; i++) {
        h ^= p[i];
        h *= 1099511628211ULL;
    }
    return h;
}

static int entry_expired(const dictEntry *e, int64_t t)
{
    return e->expire_at_ms != 0 && e->expire_at_ms <= t;
}

static void entry_free(dictEntry *e)
{
    free(e->key);
    free(e->val);
    free(e);
}

static void dict_resize(kv_dict *d, size_t new_size)
{
    dictEntry **old_buckets = d->buckets;
    size_t old_size = d->size;

    d->buckets = calloc(new_size, sizeof(dictEntry *));
    d->size = new_size;
    d->count = 0;

    for (size_t i = 0; i < old_size; i++) {
        dictEntry *e = old_buckets[i];
        while (e) {
            dictEntry *next = e->next;
            uint64_t h = fnv1a(e->key, e->klen) & (d->size - 1);
            e->next = d->buckets[h];
            d->buckets[h] = e;
            d->count++;
            e = next;
        }
    }
    free(old_buckets);
}

kv_dict *kv_dict_create(void)
{
    kv_dict *d = calloc(1, sizeof(kv_dict));
    d->size = 64;
    d->buckets = calloc(d->size, sizeof(dictEntry *));
    return d;
}

void kv_dict_free(kv_dict *d)
{
    if (!d) return;
    kv_dict_flush(d);
    free(d->buckets);
    free(d);
}

int kv_dict_set(kv_dict *d, const char *key, size_t klen, const char *val, size_t vlen, int64_t expire_at_ms)
{
    int64_t t = now_ms();
    uint64_t h = fnv1a(key, klen) & (d->size - 1);

    /* overwrite if exists (replacing expired entry too) */
    for (dictEntry *e = d->buckets[h]; e; e = e->next) {
        if (e->klen == klen && memcmp(e->key, key, klen) == 0) {
            if (entry_expired(e, t)) {
                /* treat as absent: unlink and re-insert */
                int unlinked = 0;
                dictEntry **pp = &d->buckets[h];
                while (*pp) {
                    if (*pp == e) { *pp = e->next; unlinked = 1; d->count--; break; }
                    pp = &(*pp)->next;
                }
                if (unlinked) entry_free(e);
                break;
            }
            free(e->val);
            e->val = malloc(vlen ? vlen : 1);
            memcpy(e->val, val, vlen);
            e->vlen = vlen;
            e->expire_at_ms = expire_at_ms;
            return 0;
        }
    }

    dictEntry *e = calloc(1, sizeof(dictEntry));
    e->key = malloc(klen ? klen : 1);
    memcpy(e->key, key, klen);
    e->klen = klen;
    e->val = malloc(vlen ? vlen : 1);
    memcpy(e->val, val, vlen);
    e->vlen = vlen;
    e->expire_at_ms = expire_at_ms;
    e->next = d->buckets[h];
    d->buckets[h] = e;
    d->count++;

    if (d->count > d->size * 0.7)
        dict_resize(d, d->size * 2);
    return 0;
}

const char *kv_dict_get(kv_dict *d, const char *key, size_t klen, size_t *vlen_out)
{
    int64_t t = now_ms();
    uint64_t h = fnv1a(key, klen) & (d->size - 1);
    dictEntry **pp = &d->buckets[h];

    while (*pp) {
        dictEntry *e = *pp;
        if (e->klen == klen && memcmp(e->key, key, klen) == 0) {
            if (entry_expired(e, t)) {
                *pp = e->next;
                d->count--;
                entry_free(e);
                return NULL;
            }
            if (vlen_out) *vlen_out = e->vlen;
            return e->val;
        }
        pp = &e->next;
    }
    return NULL;
}

int kv_dict_del(kv_dict *d, const char *key, size_t klen)
{
    int64_t t = now_ms();
    uint64_t h = fnv1a(key, klen) & (d->size - 1);
    dictEntry **pp = &d->buckets[h];

    while (*pp) {
        dictEntry *e = *pp;
        if (e->klen == klen && memcmp(e->key, key, klen) == 0) {
            *pp = e->next;
            d->count--;
            int was_live = !entry_expired(e, t);
            entry_free(e);
            return was_live ? 1 : 0;
        }
        pp = &e->next;
    }
    return 0;
}

int kv_dict_exists(kv_dict *d, const char *key, size_t klen)
{
    return kv_dict_get(d, key, klen, NULL) != NULL;
}

size_t kv_dict_count(kv_dict *d)
{
    int64_t t = now_ms();
    size_t n = 0;
    for (size_t i = 0; i < d->size; i++) {
        for (dictEntry *e = d->buckets[i]; e; e = e->next) {
            if (!entry_expired(e, t)) n++;
        }
    }
    return n;
}

size_t kv_dict_sweep_expired(kv_dict *d, int64_t now)
{
    size_t removed = 0;
    for (size_t i = 0; i < d->size; i++) {
        dictEntry **pp = &d->buckets[i];
        while (*pp) {
            dictEntry *e = *pp;
            if (entry_expired(e, now)) {
                *pp = e->next;
                d->count--;
                entry_free(e);
                removed++;
            } else {
                pp = &e->next;
            }
        }
    }
    return removed;
}

void kv_dict_flush(kv_dict *d)
{
    for (size_t i = 0; i < d->size; i++) {
        dictEntry *e = d->buckets[i];
        while (e) {
            dictEntry *next = e->next;
            entry_free(e);
            e = next;
        }
        d->buckets[i] = NULL;
    }
    d->count = 0;
}

int64_t kv_dict_ttl_ms(kv_dict *d, const char *key, size_t klen)
{
    int64_t t = now_ms();
    uint64_t h = fnv1a(key, klen) & (d->size - 1);

    for (dictEntry *e = d->buckets[h]; e; e = e->next) {
        if (e->klen == klen && memcmp(e->key, key, klen) == 0) {
            if (entry_expired(e, t)) return -2;
            if (e->expire_at_ms == 0) return -1;
            return e->expire_at_ms - t;
        }
    }
    return -2;
}

int kv_dict_expire(kv_dict *d, const char *key, size_t klen, int64_t expire_at_ms)
{
    int64_t t = now_ms();
    uint64_t h = fnv1a(key, klen) & (d->size - 1);
    dictEntry **pp = &d->buckets[h];

    while (*pp) {
        dictEntry *e = *pp;
        if (e->klen == klen && memcmp(e->key, key, klen) == 0) {
            if (entry_expired(e, t)) {
                *pp = e->next;
                d->count--;
                entry_free(e);
                return 0;
            }
            e->expire_at_ms = expire_at_ms;
            return 1;
        }
        pp = &e->next;
    }
    return 0;
}
